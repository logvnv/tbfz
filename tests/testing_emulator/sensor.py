""" Модуль класса Sensor """
import itertools
import socket


class Sensor():
    """Симуляция одноко станка, с возможностью
       переключения состояний вкл/выкл"""

    id_iter = itertools.count()

    def __init__(self):
        self.id = next(self.id_iter)
        self.is_running = True
        self.testing_str = ""
        self.testing_id = ""
        
    def switch(self):
        """Переключение состояния вкл/выкл"""


        if self.is_running is True:
            self.is_running = False
            self.testing_str = "Станок №{} остановлен.".format(self.id)
            self.testing_id = 'i' + str(self.id)
        else:
            self.is_running = True
            self.testing_str = "Станок №{} запущен.".format(self.id)
            self.testing_id = 'a' + str(self.id)

