from lxml import html
import requests

domain = "thefreedictionary.com"

positions = {"start":"s", "end":"e", "any":"d"}


def idioms(word, pos = "end"):
  url = "http://idioms.{0}/{1}/{2}".format(domain, positions[pos], word)
  page = requests.get(url)
  tree = html.fromstring(page.text)
  ids = tree.xpath('//div/table/tr/td/a/text()')
  ids = [aid.lower() for aid in ids]
  ids = sorted(ids, key=lambda aid: len(aid.split(" ")), reverse=True)
  print ids
  ids
