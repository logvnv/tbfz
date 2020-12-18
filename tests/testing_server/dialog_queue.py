""" Модуль класса Queue """

import json
import socket
from requests.exceptions import ReadTimeout
from dialog import Dialog

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

    def __init__(self, n=10, ip="127.0.0.1", port=9090):
        self.dialogs = []
        self.offset = 0
        self.data = ""
        self.test_str = ""


        self.states = {}

        # TODO: получить причины из базы данных
        self.reasons = ['Причина1', 'Причина2']



    def add_dialog(self, machine_id, sboi_id):
        """ Создать новые диалоги по новому случаю сбоя """
        # TODO: Вычислить людей ответственных за данных станок через бд
        user_ids = [304817715, ]
        for user_id in user_ids:
            dialog = Dialog(self.bot, user_id, machine_id, sboi_id)
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
                user_id = update.message.from_user.id
                msg_text = update.message.text.strip().lower()

                if msg_text.startswith('/'):
                    self.__comand_handler(user_id, msg_text[1:])
                    continue

                if not self.__conversation(user_id, msg_text):
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

    def listen_to_sensors(self):
        """ Слушаем датчики """

        data_s = self.data
        machine_id = data_s[1:]
        state = data_s[0]
        if state == 'i':
            self.test_str = "Получено сообщение о сбое на машине №{}.".format(
                machine_id)
            # TODO: фиксируем в базе данных
            sboi_id = 0  # TODO: id сбоя в базе данных
            self.states[machine_id] = False
        elif state == 'a':
            self.test_str = "Получено сообщение о запуске машины №{}.".format(
                machine_id)
            self.states[machine_id] = True


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
        if msg_text == 'start':
            self.bot.send_message(user_id, GREETINGS_TEXT,
                                  reply_markup=json.dumps({
                                      'keyboard': [['/state']],
                                      'resize_keyboard': True}))
        elif msg_text == 'help':
            self.bot.send_message(user_id, HELP_TEXT,
                                  reply_markup=json.dumps({
                                      'keyboard': [['/state']],
                                      'resize_keyboard': True}))
        elif msg_text == 'state':
            # TODO: Вычислить номера станков, связанных с вопрошающим
            n_sensors = ['1', '3', '7', '100']
            states = {}
            for i in n_sensors:
                states[i] = (self.states[i] if i in self.states.keys()
                             else False)
            self.bot.send_message(user_id, str(states)[1:-1].replace(
                ', ', '\n').replace(
                    'True', 'Работает').replace(
                        'False', 'Простаивает'))
        elif msg_text.startswith('sub') and msg_text.split()[0] == 'sub':
            sensors = msg_text.split()[1:]
            if len(sensors) > 0:
                for sensor in sensors:
                    pass  # TODO: add to database
                self.bot.send_message(user_id, 'Вы подписались на оборудование\
 с номерами {}.'.format(sensors),
                                      reply_markup=json.dumps({
                                          'keyboard': [['/state']],
                                          'resize_keyboard': True}))
            else:
                self.bot.send_message(user_id, 'Команда использована неверно.\
 \nИспользуйте /sub n1 n2 ..., где ni - номер станка на который вы хотите\
 подписаться.')
        elif msg_text.startswith('unsub') and msg_text.split()[0] == 'unsub':
            if msg_text.split()[0] != 'unsub':
                return
            sensors = msg_text.split(' ')[1:]
            if len(sensors) > 0:
                for sensor in sensors:
                    pass  # TODO: add to database
                self.bot.send_message(user_id, 'Вы отписались от оборудования\
 с номерами {}.'.format(sensors),
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

    def conversation(self, user_id, msg_text):
        """ Ведем переписку в пределах диалога """
        answered = False
        for i, dialog in enumerate(self.dialogs):
            if dialog.user_id == user_id:
                answered = True
                if dialog.state == 1:
                    if msg_text == 'нет':
                        self.bot.send_message(user_id, 'На нет и суда нет.',
                                              reply_markup=json.dumps({
                                                  'keyboard': [['/state']],
                                                  'resize_keyboard': True}))
                        del self.dialogs[i]
                    elif msg_text == 'да':
                        dialog.ask(self.reasons)
                    else:
                        self.bot.send_message(user_id,
                                              'Не понял... Да или нет?',
                                              reply_markup=json.dumps({
                                                  'keyboard':
                                                  [['Да'], ['Нет']],
                                                  'resize_keyboard': True,
                                                  'one_time_keyboard': True}))
                elif dialog.state == 2:
                    if msg_text in [r.lower() for r in self.reasons]:
                        # TODO: записать в БД
                        self.bot.send_message(user_id,
                                              'Спасибо, зафиксировали.',
                                              reply_markup=json.dumps({
                                                  'keyboard': [['/state']],
                                                  'resize_keyboard': True}))
                        del self.dialogs[i]
                    else:
                        # self.__try_guess(msg_te xt)
                        dialog.state = 3
                        self.bot.send_message(user_id, 'Так и запишем.',
                                              reply_markup=json.dumps({
                                                  'keyboard': [['/state']],
                                                  'resize_keyboard': True}))
                        del self.dialogs[i]
                break
        return answered
