import unittest
from dialog_queue import Queue

class TestQueue(unittest.TestCase):
    test_queue = Queue()
    def test_message(self):
        self.test_queue.data = "i5"
        self.test_queue.listen_to_sensors()
        self.assertEqual(self.test_queue.test_str, 'Получено сообщение о сбое на машине №5.', "Should be work")
        
    def test_message_n(self):
        self.test_queue.data = "a4"
        self.test_queue.listen_to_sensors()
        self.assertEqual(self.test_queue.test_str, 'Получено сообщение о запуске машины №4.', "Should be work")
    
    def test_state(self):
        self.test_queue.data = "a1"
        self.test_queue.listen_to_sensors()
        self.assertEqual(self.test_queue.states['1'], True, "Should be work")
        
if __name__ == '__main__':
    unittest.main()
