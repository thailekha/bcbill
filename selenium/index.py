#!/usr/bin/env python3
import client
import provider
from screenshoter import Screenshoter
from utils import (
    driver,
    delete_and_recreate_folder,
    replace_placeholders,
    CLIENT_APP,
    CLIENT_NAME,
    screenshot_code,
    CLIENT_APP_SRC,
    CLIENT_APP_DST,
    SERVER_NAME,
    ENDPOINT,
)

if __name__ == "__main__":
    delete_and_recreate_folder("screenshots")
    # c = driver(debug=True)
    # p = driver(debug=True)
    c = driver()
    p = driver()
    ss = Screenshoter()
    provider.onboarding(p, ss)
    print("provider onboarded")
    client_wallet = client.onboarding(c, ss)
    print("client onboarded")
    provider.approve(p, ss)
    print("provider approved")
    grant_id = client.view_approved(c, ss)

    # generate client app

    replace_placeholders(
        CLIENT_APP_SRC,
        CLIENT_APP_DST,
        SERVER_NAME,
        ENDPOINT,
        f"{CLIENT_APP}_{CLIENT_NAME}",
        client_wallet,
        grant_id,
    )
    screenshot_code(ss, CLIENT_APP_DST)
    client.launch_client_app(driver(size="window-size=800,800"), ss)
