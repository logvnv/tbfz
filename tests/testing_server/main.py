""" Модуль инициализирующий бота и запускающий
основной цикл """

from dialog_queue import Queue
import telebot

bot = telebot.TeleBot("1360021835:AAH6TiVUMojZBIk2U0zsyjMvVwTR3RdTZDM", threaded = False)  # Почему то теперь требует threaded

q = Queue(bot)
print('_' * 54)
print("\nTelegram-бот запущен и ожидает подключений датчиков...\n")
q.update()
