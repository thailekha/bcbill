#!/usr/bin/env python3

import traceback
import json
import sys

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.wait import WebDriverWait

def get_client_login_creds():
    with open('ui-data.json') as f:
        data = json.load(f)
    appname, username = data['clientA'].split('_')
    wallet = data['clientA_wallet']
    return appname, username, wallet

def get_provider_login_creds():
    with open('ui-data.json') as f:
        data = json.load(f)
    return data['providerX'], data['providerX_wallet']

def get_chrome_driver(debug=False):
    options = webdriver.ChromeOptions()
    options.add_argument("ignore-certificate-errors")
    options.add_argument("disable-extensions")
    options.add_argument("disable-gpu")
    if debug:
        options.add_experimental_option("detach", True)
    else:
        options.add_argument("headless")
        options.add_argument("window-size=1920,1080")
    return webdriver.Chrome(options=options)


def client():
    try:
        driver = get_chrome_driver(debug=True)
        driver.get("http://localhost:9999/ui/login")
        appname, username, wallet = get_client_login_creds()
        driver.find_element(By.ID, "appname").send_keys(appname)
        driver.find_element(By.ID, "username").send_keys(username)
        driver.find_element(By.ID, "wallet").send_keys(wallet)
        driver.find_element(By.TAG_NAME, "form").submit()
    except Exception:
        traceback.print_exc()


def provider():
    try:
        driver = get_chrome_driver(debug=True)
        driver.get("http://localhost:9999/ui/login")
        username, wallet = get_provider_login_creds()
        driver.find_element(By.ID, "username").send_keys(username)
        driver.find_element(By.ID, "wallet").send_keys(wallet)
        driver.find_element(By.ID, "isProviderCheckbox").click()
        driver.find_element(By.TAG_NAME, "form").submit()
    except Exception:
        traceback.print_exc()


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'pro':
        provider()
    elif len(sys.argv) > 1 and sys.argv[1] == 'cli':
        client()
    else:
        print("Please provide an argument of 'cli' or 'pro'")
