""" Модуль класса Supervisor """


class Supervisor():
    """Управляющий множеством станков"""

    def __init__(self, sensors):
        self.sensors = sensors
        print("Запущено {} станков.".format(len(sensors)))

    def switch(self, n):
        """Вкл/выкл стонка по его номеру"""
        if n > len(self.sensors) or n < 0:
            print("Нет машины с таким номером. \
Попробуйте номера от 1 до {}".format(len(self.sensors)))
        else:
            self.sensors[n].switch()

    def start(self):
        """Интерактивный цыкл"""
        while True:
            c = input()
            if c == 'q':
                break

            try:
                self.switch(int(c)-1)
            except ConnectionRefusedError:
                print("Уведомление не отправленно: не удалось \
подключиться к серверу.")
            except (IndexError, ValueError):
                print("Неопознаный символ. Введите 'q' для завершения или \
номера от 1 до {}.".format(len(self.sensors)))
