class Screenshoter:
    def __init__(self):
        self.counter = 0

    def save(self, driver, name):
        self.counter += 1
        driver.save_screenshot(f"./screenshots/{self.counter}-{name}.png")
