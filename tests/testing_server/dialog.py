""" Модуль класса Dialog """

from datetime import datetime as dt
import json

ru_months = {
    1: "января",
    2: "февраля",
    3: "марта",
    4: "апреля",
    5: "мая",
    6: "июня",
    7: "июля",
    8: "августа",
    9: "сентября",
    10: "октября",
    11: "ноября",
    12: "декабря"
}


class Dialog():
    """ Диалог в Телеграмме на каждый случай сбоя для каждого
    ответственного пользователя. Отслеживает этапы опроса. """

    def __init__(self, tele_bot, user_id, machine_id, sboi_id):
        self.bot = tele_bot
        self.user_id = user_id
        self.machine_id = machine_id
        self.time = dt.now()
        self.state = 0
        self.sboi_id = sboi_id

    def start(self):
        """ Начало диалога. Бот посылает первое сообщение.
        Не срабатывает при инициализации тк диалог может быть
        в очереди """
        self.bot.send_message(self.user_id,
                              '❗{}ого {} в {} была зафиксирована остановка \
станка №{}.\nЗнаете ли вы, что послужило причиной?\
'.format(self.time.day, ru_months[self.time.month],
         self.time.strftime("%H:%M"),
         self.machine_id),
                              reply_markup=json.dumps({
                                  'keyboard': [['Да'], ['Нет']],
                                  'resize_keyboard': True,
                                  'one_time_keyboard': True}))
        self.state = 1

    def ask(self, reasons):
        """ Продолжение диалога с просьбой указать причину сбоя """
        key_board = [[r] for r in reasons]
        self.bot.send_message(self.user_id, "Что же?\nПожалуйста выберите \
один из предложенных вариантов или опишите словами.",
                              reply_markup=json.dumps({
                                  'keyboard': key_board,
                                  'resize_keyboard': True,
                                  'one_time_keyboard': True}))
        self.state = 2
