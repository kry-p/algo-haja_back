# -*- coding: utf-8 -*-
import sys
import cfscrape
import json
from bs4 import BeautifulSoup as bs

BASE_URL = "https://acmicpc.net/user/"
AC_SELECTOR = "body > div.wrapper > div.container.content > div.row > div:nth-child(2) > div > div.col-md-9 > div:nth-child(2) > div.panel-body > div > a"
WA_SELECTOR = "body > div.wrapper > div.container.content > div.row > div:nth-child(2) > div > div.col-md-9 > div:nth-child(3) > div.panel-body > div > a"

scraper = cfscrape.create_scraper()

def scrap_user(user):
    def get_text(soup):
        return (int)(soup.get_text())

    res = scraper.get("https://acmicpc.net/user/%s" % user)
    if str(res.status_code) == "403":
        return
    soup = bs(res.content, "html.parser")
    ac_elements = soup.select(AC_SELECTOR)
    wa_elements = soup.select(WA_SELECTOR)
    ac = list(map(get_text, ac_elements))
    wa = list(map(get_text, wa_elements))

    print(json.dumps({ 'solved': ac, 'wrong': wa }))


if __name__ == "__main__":
    username = sys.argv[1]
    scrap_user(username)