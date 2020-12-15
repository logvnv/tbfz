""" Модуль класса Sensor """

import itertools
import socket

import server_config

class Sensor():
    """Симуляция одноко станка, с возможностью
       переключения состояний вкл/выкл"""

    id_iter = itertools.count()

    def __init__(self):
        self.id = next(self.id_iter) + 1
        self.is_running = True

        sock = socket.socket()
        sock.connect((server_config.SERV_HOST, server_config.SERV_PORT))
        sock.send(('a' + str(self.id)).encode())
        _ = sock.recv(1024)
        sock.close()

    def switch(self):
        """Переключение состояния вкл/выкл"""

        sock = socket.socket()
        sock.connect((server_config.SERV_HOST, server_config.SERV_PORT))

        if self.is_running is True:
            self.is_running = False
            print("Станок №{} остановлен.".format(self.id))
            sock.send(('i' + str(self.id)).encode())
        else:
            self.is_running = True
            print("Станок №{} запущен.".format(self.id))
            sock.send(('a' + str(self.id)).encode())

        _ = sock.recv(1024)
        sock.close()
