""" Модуль инициализирующий датчики """

from supervisor import Supervisor
from sensor import Sensor

print("Сколько датчиков запустить?")
N_SENSORS = None  # Количество станков
while True:
    try:
        N_SENSORS = int(input())
        if N_SENSORS > 0:
            break
        raise ValueError
    except ValueError:
        print("Введите натуральное число число.")

Sensors = [Sensor() for i in range(1, N_SENSORS+1)]
sv = Supervisor(Sensors)
sv.start()
