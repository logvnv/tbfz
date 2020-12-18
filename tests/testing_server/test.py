import requests

url = "https://api.telegram.org/bot1360021835:AAH6TiVUMojZBIk2U0zsyjMvVwTR3RdTZDM/"

response = requests.get(url + 'getUpdates').json()
print(response['ok'])
