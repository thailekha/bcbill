import os
import subprocess
import time
import traceback
import re
import json

from selenium.webdriver.common.by import By

from utils import (
    CLIENT_APP,
    CLIENT_NAME,
    wait_for_xpath,
    wait_for_id,
    CLIENT_PROVIDER_BTN,
    CLIENT_ENDPOINT_BTN,
    CLIENT_GRANT_ID,
    PURRFECT_DST,
    wait_for_tags,
)


def onboarding(c, ss):
    try:
        # Register
        c.get("http://localhost:9999/ui/register")
        c.find_element(By.ID, "appname").send_keys(CLIENT_APP)
        c.find_element(By.ID, "username").send_keys(CLIENT_NAME)
        ss.save(c, "client-register")
        c.find_element(By.TAG_NAME, "form").submit()

        # Get wallet
        password_span = wait_for_xpath(
            c,
            '//div[@class="alert alert-success"]/span[contains(text(), "Here is your password, please copy it since '
            'it is shown only once:")]',
        )
        client_wallet = password_span.text.split(": ")[-1]
        ss.save(c, "client-copy-token")
        data = {"entityID": f"{CLIENT_APP}_{CLIENT_NAME}", "wallet": client_wallet}
        with open("data.json", "w") as file:
            json.dump(data, file)

        # Login
        c.find_element(By.ID, "appname").send_keys(CLIENT_APP)
        c.find_element(By.ID, "username").send_keys(CLIENT_NAME)
        c.find_element(By.ID, "wallet").send_keys(client_wallet)
        ss.save(c, "client-login")
        c.find_element(By.TAG_NAME, "form").submit()

        # Expand provider
        client_provider_btn = wait_for_id(c, CLIENT_PROVIDER_BTN)
        ss.save(c, "client-home")
        client_provider_btn.click()
        time.sleep(0.5)
        ss.save(c, "client-select-provider")
        wait_for_id(c, CLIENT_ENDPOINT_BTN).click()
        time.sleep(0.5)
        wait_for_id(c, CLIENT_PROVIDER_BTN).click()
        time.sleep(1.5)
        ss.save(c, "client-request-endpoint")

        return client_wallet
    except Exception:
        traceback.print_exc()


def view_approved(c, ss):
    c.refresh()
    client_provider_btn = wait_for_id(c, CLIENT_PROVIDER_BTN)
    client_provider_btn.click()
    time.sleep(1.5)
    ss.save(c, "client-vew-approved-endpoint")
    grant_id_header = wait_for_id(c, CLIENT_GRANT_ID)
    grant_id = re.findall(r"\((.*?)\)", grant_id_header.text)[0]
    with open("data.json", "r") as file:
        data = json.load(file)
        data["endpointAccessGrantId"] = grant_id

    with open("data.json", "w") as file:
        json.dump(data, file)
    return grant_id


def kill_process_on_port(port):
    subprocess.run(["fuser", "-n", "tcp", "-k", f"{port}"])


def start_nodejs_file(file_path):
    file_directory = os.path.dirname(file_path)
    subprocess.Popen(
        ["/home/vagrant/.nvm/versions/node/v14.19.3/bin/node", file_path],
        cwd=file_directory,
    )


def launch_purrfect(c, ss):
    kill_process_on_port(3000)
    start_nodejs_file(PURRFECT_DST)
    time.sleep(1)
    c.get("http://localhost:3000")
    wait_for_tags(c, "img")
    time.sleep(2)
    ss.save(c, "purrfect-zone")
