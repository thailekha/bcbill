import os
import random
import shutil
import string
import re

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.wait import WebDriverWait

random_string = "".join(random.choices(string.ascii_letters + string.digits, k=10))
# random_string = ""
PROVIDER_NAME = "sample-provider" + random_string
CLIENT_NAME = "developer1" + random_string
CLIENT_APP = "sample-app" + random_string
provider_wallet = ""
SERVER_NAME = "sample-server"
HOST_ADDR = "http://localhost:9998"
SERVER_BTN = f"{SERVER_NAME}-btn"
ENDPOINT = "sample-endpoint"
ENDPOINT_WITH_VERB = f"GET /{ENDPOINT}"
client_wallet = ""
CLIENT_PROVIDER_BTN = f"provider_{PROVIDER_NAME}-btn"
CLIENT_ENDPOINT_BTN = f"provider_{PROVIDER_NAME}-{SERVER_NAME}-GET-{ENDPOINT}-btn"
CLIENT_GRANT_ID = f"provider_{PROVIDER_NAME}-{SERVER_NAME}-GET-{ENDPOINT}-grant-id"


PURRFECT_SRC = "../purrfect-zone/index-template.js"
PURRFECT_DST = "../purrfect-zone/purrfect.js"


def wait_for_xpath(driver, path):
    return WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.XPATH, path))
    )


def wait_for_id(driver, id):
    return WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, id)))


def wait_for_tags(driver, tag):
    return WebDriverWait(driver, 10).until(
        EC.presence_of_all_elements_located((By.TAG_NAME, tag))
    )


def driver(debug=False, size="window-size=1080,1080"):
    options = webdriver.ChromeOptions()
    options.add_argument("ignore-certificate-errors")
    options.add_argument("disable-extensions")
    options.add_argument("disable-gpu")
    if debug:
        options.add_experimental_option("detach", True)
    else:
        options.add_argument("headless")
        options.add_argument(size)
    d = webdriver.Chrome(options=options)
    # d.execute_script("document.body.style.zoom = '1.8';")
    # d.execute_script("document.body.style.zoom='200%'")
    return d


def delete_and_recreate_folder(folder_path):
    if os.path.exists(folder_path):
        shutil.rmtree(folder_path)
    os.makedirs(folder_path)


def replace_placeholders(
    input_file, output_file, server_name, endpoint, entity_id, wallet, grant_id
):
    with open(input_file, "r") as input_file:
        content = input_file.read()

    content = re.sub(r"SERVER_NAME_HERE", server_name, content)
    content = re.sub(r"ENDPOINT_HERE", endpoint, content)
    content = re.sub(r"ENTITY_ID_HERE", entity_id, content)
    content = re.sub(r"WALLET_HERE", wallet, content)
    content = re.sub(r"GRANT_ID_HERE", grant_id, content)

    with open(output_file, "w") as output_file:
        output_file.write(content)


def screenshot_code(ss, file):
    absolute_path = os.path.abspath(file)
    d = driver()
    d.get("file://" + absolute_path)
    ss.save(d, "purrfect_code")
    # d.quit()
