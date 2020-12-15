""" Модуль класса Queue """

import json
import socket
from requests.exceptions import ReadTimeout
from dialog import Dialog
import pymysql
from datetime import datetime

import db_config

GREETINGS_TEXT = 'Приветствую!👋\
\n\nДанный телеграм-бот🤖 предназначен для отслеживания причин остановок \
оборудования на нашем заводе🏭.\n\nМы сами с тобой свяжемся, если заприметим \
что-то неладное🤨. Тем не менее ты можешь воспользоваться командой "/state", \
чтобы узнать состояние относящегося к тебе оборудования.\
\n\n⚠Для начала работы, тебе необходимо подписаться на оборудование за \
которое ты отвечаешь используя команду /sub. Например, чтобы подписаться на \
станки 1, 2 и 3 используй:\n\t/sub 1 2 3\
\nЕсли ты больше не отвечаешь за какое-то оборудование, ты можешь отписаться \
от негоиспользуя /unsub.'

HELP_TEXT = 'Вам доступны следующие команды:\n\n\
👉/state - Узнать состояние оборудования, на которое вы подписаны. \n\
👉/sub - Подписаться на оборудование (пример: /sub 1 2 3).\n\
👉/unsub - Отписаться от оборудования (пример: /unsub 1 2 3).\n\
👉/start - Вывести приветствие.\n\
👉/help - Вывести это сообщение.'


class Queue():
    """ Класс очереди для диалогов. Если произошло несколько сбоев
    за которые ответственнен один человек, они не прийдут ему
    сразу, но последовательно. Содержит основной цикл и
    обработку сообщений """

    def __init__(self, tele_bot, n=10, ip="127.0.0.1", port=9090):
        self.bot = tele_bot
        self.dialogs = []
        self.offset = 0
        updates = self.bot.get_updates(timeout=1)
        if len(updates) > 0:
            self.offset = updates[-1].update_id + 1

        self.states = {}


        # Получить причины из базы данных
        # self.reasons = ['Причина1', 'Причина2']

        self.reasons = {}
        connection = pymysql.connect(db_config.DB_HOST, db_config.DB_USER_NAME, db_config.DB_PASSWORD, db_config.DB_NAME)
        with connection.cursor() as cursor:
            sql = "SELECT failure_cause_id, category FROM failure_cause";
            cursor.execute(sql)
            for row in cursor.fetchall():
                self.reasons[row[1]] = row[0]
        connection.close()
        

        self.server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.server.bind((ip, port))
        self.server.listen(n)

    def add_dialog(self, machine_id, machine_name, sboi_id):
        """ Создать новые диалоги по новому случаю сбоя """
        # Вычислить людей ответственных за данных станок через бд
        # user_ids = [1266388430, ]
        user_ids = []
        connection = pymysql.connect(db_config.DB_HOST, db_config.DB_USER_NAME, db_config.DB_PASSWORD, db_config.DB_NAME)
        with connection.cursor() as cursor:
            sql = "SELECT telegram_id FROM worktime LEFT JOIN worker USING(worker_id) WHERE machine_id = (%s);"
            cursor.execute(sql, (machine_id,))
            for row in cursor.fetchall():
                user_ids.append(row[0])
        connection.close()
        user_ids = set(user_ids)

        for user_id in user_ids:
            dialog = Dialog(self.bot, user_id, machine_id, machine_name, sboi_id)
            if user_id not in [d.user_id for d in self.dialogs]:
                dialog.start()
            self.dialogs.append(dialog)

    def update(self):
        """ Основной цикл. Слушаем датчики,
        Слушаем телеграмм, обрабатываем сообщения"""
        while True:
            # Принимаем новые сбои если есть
            self.__listen_to_sensors()

            # Проверяем обновления
            updates = self.__get_telegram_updates()

            for update in updates:
                user_id = str(update.message.from_user.id)
                msg_text = ''
                try:
                    msg_text = update.message.text.strip()
                except AttributeError:
                    self.bot.send_message(user_id, 'Обыденное общение не \
предусмотренно.\nПопробуйте воспользоваться командой \
/help, чтобы узнать доступные вам команды.',
                                          reply_markup=json.dumps({
                                              'keyboard': [['/help']],
                                              'resize_keyboard': True}))

                if msg_text.startswith('/'):
                    self.__comand_handler(user_id, msg_text[1:])
                    continue

                if not self.__conversation(user_id, msg_text):
                    #print(msg_text)
                    self.bot.send_message(user_id, 'Обыденное общение не \
предусмотренно.\nПопробуйте воспользоваться командой \
/help, чтобы узнать доступные вам команды.',
                                          reply_markup=json.dumps({
                                              'keyboard': [['/help']],
                                              'resize_keyboard': True}))

            used_user_ids = []
            for dialog in self.dialogs:
                if dialog.user_id not in used_user_ids:
                    used_user_ids.append(dialog.user_id)
                    if dialog.state == 0:
                        dialog.start()

    def __listen_to_sensors(self):
        """ Слушаем датчики """
        self.server.settimeout(1)
        try:
            clientsock, _ = self.server.accept()
            self.server.settimeout(None)
            data = clientsock.recv(1024).decode()
            machine_id = data[1:]
            state = data[0]
            machine_name = None
            
            connection = pymysql.connect(db_config.DB_HOST, db_config.DB_USER_NAME, db_config.DB_PASSWORD, db_config.DB_NAME)
            with connection.cursor() as cursor:
                sql = "SELECT machine_name FROM machine WHERE `machine_id` = (%s);"
                cursor.execute(sql, (machine_id,))
                machine_name = cursor.fetchone()[0]
            connection.close()

            if state == 'i':
                print("Полученно сообщение о сбое на машине №{}.".format(
                    machine_id))
                # фиксируем в базе данных
                # id сбоя в базе данных
                sboi_id = None
                cur_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                

                connection = pymysql.connect(db_config.DB_HOST, db_config.DB_USER_NAME, db_config.DB_PASSWORD, db_config.DB_NAME)
                with connection.cursor() as cursor:
                    sql = "INSERT INTO failure (machine_id, `time`) VALUES ((%s),(%s));"
                    cursor.execute(sql, (machine_id, cur_time))
                    connection.commit()

                    sql = "SELECT failure_id FROM failure WHERE `machine_id` = (%s) AND `time` = (%s);"
                    cursor.execute(sql, (machine_id, cur_time))
                    sboi_id = cursor.fetchone()[0]
                connection.close()
                  
                self.add_dialog(machine_id, machine_name, sboi_id)
                self.states[machine_name] = False
            elif state == 'a':
                print("Полученно сообщение о запуске машины №{}.".format(
                    machine_id))
                self.states[machine_name] = True

            clientsock.send(bytes("ok", 'UTF-8'))
        except socket.timeout:
            self.server.settimeout(None)

    def __get_telegram_updates(self):
        """ Слушаем телеграм """
        updates = []
        try:
            updates = self.bot.get_updates(offset=self.offset, timeout=5)
        except ReadTimeout:
            print('Exception happened: ReadTimeout')

        if len(updates) != 0:
            self.offset = updates[-1].update_id + 1

        return updates

    def __comand_handler(self, user_id, msg_text):
        """ Обрабатываем сообщения начинащиеся с / """
        worker_id = None
        connection = pymysql.connect(db_config.DB_HOST, db_config.DB_USER_NAME, db_config.DB_PASSWORD, db_config.DB_NAME)
        with connection.cursor() as cursor:
            sql = "SELECT worker_id FROM worker WHERE telegram_id = (%s)"
            cursor.execute(sql, (user_id,))
            worker_id = cursor.fetchone()[0]
        connection.close()

        if msg_text.lower() == 'start':
            self.bot.send_message(user_id, GREETINGS_TEXT,
                                  reply_markup=json.dumps({
                                      'keyboard': [['/state']],
                                      'resize_keyboard': True}))
        elif msg_text.lower() == 'help':
            self.bot.send_message(user_id, HELP_TEXT,
                                  reply_markup=json.dumps({
                                      'keyboard': [['/state']],
                                      'resize_keyboard': True}))
        elif msg_text.lower() == 'state':
            # Вычислить номера станков, связанных с вопрошающим
            #n_sensors = ['1', '3', '7', '100']
            sensor_names = []
            connection = pymysql.connect(db_config.DB_HOST, db_config.DB_USER_NAME, db_config.DB_PASSWORD, db_config.DB_NAME)
            with connection.cursor() as cursor:
                sql = "SELECT machine_name FROM worktime LEFT JOIN worker USING(worker_id) LEFT JOIN machine USING(machine_id) WHERE telegram_id = (%s)"
                cursor.execute(sql, (user_id,))
                for row in cursor.fetchall():
                    sensor_names.append(row[0])
            connection.close()

            states = {}
            for name in sensor_names:
                states[name] = (self.states[name] if name in self.states.keys()
                             else False)

            if len(states) > 0:
                self.bot.send_message(user_id, str(states)[1:-1].replace(
                    ', ', '\n').replace(
                        'True', 'Работает').replace(
                            'False', 'Простаивает'))
            else:
                self.bot.send_message(user_id, "За вами не закреплено никакого оборудования.\n\
Вы можете воспользоваться командой /sub 1 2 3, чтобы подписаться на оборудование 1, 2 и 3.")

        elif msg_text.lower().startswith('sub') and msg_text.lower().split()[0] == 'sub':
            sensors = msg_text.split()[1:]
            good_sensors = []
            if len(sensors) > 0:
                connection = pymysql.connect(db_config.DB_HOST, db_config.DB_USER_NAME, db_config.DB_PASSWORD, db_config.DB_NAME)
                with connection.cursor() as cursor:
                    sql = "SELECT * FROM machine"
                    cursor.execute(sql)
                    data = cursor.fetchall()
                    machines = {machine_id: machine_name for machine_id, machine_name in data}
                    for sensor in sensors:
                        if sensor in machines.values():
                            machine_id = list(machines.keys())[list(machines.values()).index(sensor)]
                            try:
                                sql = "INSERT INTO worktime (worker_id, machine_id) VALUES ((%s),(%s))"
                                cursor.execute(sql, (worker_id, machine_id))
                                connection.commit()
                                good_sensors.append(sensor)
                            except pymysql.err.IntegrityError:
                                pass
                connection.close()
                self.bot.send_message(user_id, 'Вы подписались на оборудование\
 с номерами {}.'.format(good_sensors),
                                      reply_markup=json.dumps({
                                          'keyboard': [['/state']],
                                          'resize_keyboard': True}))
            else:
                self.bot.send_message(user_id, 'Команда использована неверно.\
 \nИспользуйте /sub n1 n2 ..., где ni - номер станка на который вы хотите\
 подписаться.')
        elif msg_text.lower().startswith('unsub') and msg_text.lower().split()[0] == 'unsub':
            if msg_text.lower().split()[0] != 'unsub':
                return
            sensors = msg_text.split(' ')[1:]
            good_sensors = []
            if len(sensors) > 0:
                connection = pymysql.connect(db_config.DB_HOST, db_config.DB_USER_NAME, db_config.DB_PASSWORD, db_config.DB_NAME)
                with connection.cursor() as cursor:
                    sql = "SELECT * FROM machine"
                    cursor.execute(sql)
                    data = cursor.fetchall()
                    machines = {machine_id: machine_name for machine_id, machine_name in data}
                    for sensor in sensors:
                        if sensor in machines.values():
                            machine_id = list(machines.keys())[list(machines.values()).index(sensor)]
                            try:
                                sql = "DELETE FROM worktime WHERE worker_id = (%s) AND machine_id = (%s)"
                                cursor.execute(sql, (worker_id, machine_id))
                                connection.commit()
                                good_sensors.append(sensor)
                            except pymysql.err.IntegrityError:
                                pass
                connection.close()
                self.bot.send_message(user_id, 'Вы отписались от оборудования\
 с номерами {}.'.format(good_sensors),
                                      reply_markup=json.dumps({
                                          'keyboard': [['/state']],
                                          'resize_keyboard': True}))
            else:
                self.bot.send_message(user_id, 'Команда использована неверно.\
 \nИспользуйте /unsub n1 n2 ..., где ni - номер станка от которого вы хотите\
 отписаться.')
        else:
            self.bot.send_message(user_id, 'Нет такой команды.\
\nПопробуйте воспользоваться командой \
/help, чтобы узнать доступные вам команды.',
                                  reply_markup=json.dumps({
                                      'keyboard': [['/help']],
                                      'resize_keyboard': True}))

    def __conversation(self, user_id, msg_text):
        """ Ведем переписку в пределах диалога """
        worker_id = None
        connection = pymysql.connect(db_config.DB_HOST, db_config.DB_USER_NAME, db_config.DB_PASSWORD, db_config.DB_NAME)
        with connection.cursor() as cursor:
            sql = "SELECT worker_id FROM worker WHERE telegram_id = (%s)"
            cursor.execute(sql, (user_id,))
            worker_id = cursor.fetchone()[0]
        connection.close()

        answered = False
        for i, dialog in enumerate(self.dialogs):
            if dialog.user_id == user_id:
                answered = True
                if dialog.state == 1:
                    if msg_text.lower() == 'нет':
                        self.bot.send_message(user_id, 'На нет и суда нет.',
                                              reply_markup=json.dumps({
                                                  'keyboard': [['/state']],
                                                  'resize_keyboard': True}))
                        del self.dialogs[i]
                    elif msg_text.lower() == 'да':
                        dialog.ask(self.reasons.keys())
                    else:
                        self.bot.send_message(user_id,
                                              'Не понял... Да или нет?',
                                              reply_markup=json.dumps({
                                                  'keyboard':
                                                  [['Да'], ['Нет']],
                                                  'resize_keyboard': True,
                                                  'one_time_keyboard': True}))
                elif dialog.state == 2:
                    if msg_text.lower() in [r.lower() for r in self.reasons]:

                        connection = pymysql.connect(db_config.DB_HOST, db_config.DB_USER_NAME, db_config.DB_PASSWORD, db_config.DB_NAME)
                        with connection.cursor() as cursor:
                            reason_id = self.reasons[list(self.reasons.keys())[[r.lower() for r in self.reasons].index(msg_text.lower())]]
                            sql = "UPDATE failure SET worker_id = (%s), failure_cause_id = (%s) WHERE failure_id = (%s);"
                            cursor.execute(sql, (worker_id, reason_id , dialog.sboi_id))
                            connection.commit()
                        connection.close()

                        self.bot.send_message(user_id,
                                              'Спасибо, зафиксировали.',
                                              reply_markup=json.dumps({
                                                  'keyboard': [['/state']],
                                                  'resize_keyboard': True}))
                        del self.dialogs[i]
                    else:
                        connection = pymysql.connect(db_config.DB_HOST, db_config.DB_USER_NAME, db_config.DB_PASSWORD, db_config.DB_NAME)
                        with connection.cursor() as cursor:
                            sql = "UPDATE failure SET worker_id = (%s), description = (%s) WHERE failure_id = (%s);"
                            cursor.execute(sql, (worker_id, msg_text, dialog.sboi_id))
                            connection.commit()
                        connection.close()

                        dialog.state = 3
                        self.bot.send_message(user_id, 'Так и запишем.',
                                              reply_markup=json.dumps({
                                                  'keyboard': [['/state']],
                                                  'resize_keyboard': True}))
                        del self.dialogs[i]
                break
        return answered
