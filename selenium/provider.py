import time
import traceback

from selenium.webdriver.common.by import By

from utils import (
    wait_for_id,
    PROVIDER_NAME,
    wait_for_xpath,
    SERVER_NAME,
    HOST_ADDR,
    SERVER_BTN,
    ENDPOINT,
)


def onboarding(p, ss):
    try:
        # Register
        p.get("http://localhost:9999/ui/register")
        wait_for_id(p, "isProviderCheckbox").click()
        wait_for_id(p, "username").send_keys(PROVIDER_NAME)
        ss.save(p, "provider-register")
        p.find_element(By.TAG_NAME, "form").submit()

        # Get wallet
        password_span = wait_for_xpath(
            p,
            '//div[@class="alert alert-success"]/span[contains(text(), "Here is your password, please copy it since '
            'it is shown only once:")]',
        )
        provider_wallet = password_span.text.split(": ")[-1]
        ss.save(p, "provider-copy-token")

        # Login
        wait_for_id(p, "isProviderCheckbox").click()
        wait_for_id(p, "username").send_keys(PROVIDER_NAME)
        wait_for_id(p, "wallet").send_keys(provider_wallet)
        ss.save(p, "provider-login")
        p.find_element(By.TAG_NAME, "form").submit()

        # Add server
        time.sleep(1)
        ss.save(p, "provider-home")
        wait_for_id(p, "add-server-btn").click()
        time.sleep(1)
        wait_for_id(p, "serverName").send_keys(SERVER_NAME)
        wait_for_id(p, "host").send_keys(HOST_ADDR)
        ss.save(p, "provider-add-server")
        p.find_element(By.XPATH, '//form[@action="/ui/AddOriginServer"]').submit()

        # Add endpoint
        time.sleep(1.5)
        server_btn = wait_for_id(p, SERVER_BTN)
        ss.save(p, "provider-select-server")
        server_btn.click()
        time.sleep(1)
        wait_for_id(p, "path").send_keys(ENDPOINT)
        ss.save(p, "provider-add-endpoint")
        p.find_element(By.XPATH, '//form[@action="/ui/AddEndpoint"]').submit()

        # Expand endpoint
        wait_for_id(p, SERVER_BTN).click()
        time.sleep(1.5)
        ss.save(p, "provider-view-endpoint")
    except Exception:
        traceback.print_exc()


def approve(p, ss):
    p.refresh()
    wait_for_id(p, SERVER_BTN).click()
    time.sleep(0.5)
    ss.save(p, "provider-view-endpoint-request")
    wait_for_xpath(p, "//button[contains(text(),'Approve')]").click()
    wait_for_id(p, SERVER_BTN).click()
    time.sleep(1.5)
    ss.save(p, "provider-view-endpoint-approved")
