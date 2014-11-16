import json
import requests
import logging

logging.basicConfig(level=logging.DEBUG)

url = "http://rhymebrain.com/talk?"


def rhymes_with(word):
  query = "{0}function=getRhymes&word={1}".format(url, word)
  print query

  r = requests.get(query)

  data = r.json()
  clean = [word for word in data if 'a' not in word['flags']]
  clean

