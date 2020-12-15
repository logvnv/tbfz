""" Модуль инициализирующий бота и запускающий
основной цикл """

import telebot
from dialog_queue import Queue

import bot_config
import server_config

bot = telebot.TeleBot(bot_config.API_KEY,
                      threaded=False)  # Почему то теперь требует threaded

q = Queue(bot, n=server_config.N_CONNECTIONS, ip=server_config.SERV_HOST, port=server_config.SERV_PORT)
print('_' * 54)
print("\nTelegram-бот запущен и ожидает подключений датчиков...\n")
q.update()
