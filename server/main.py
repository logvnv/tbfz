""" Модуль инициализирующий бота и запускающий
основной цикл """

import telebot
from dialog_queue import Queue

import config

bot = telebot.TeleBot(config.API_KEY,
                      threaded=False)  # Почему то теперь требует threaded

q = Queue(bot)
print('_' * 54)
print("\nTelegram-бот запущен и ожидает подключений датчиков...\n")
q.update()
