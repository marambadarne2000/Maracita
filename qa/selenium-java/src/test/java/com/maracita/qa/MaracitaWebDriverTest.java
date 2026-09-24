package com.maracita.qa;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Duration;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

class MaracitaWebDriverTest {
  private WebDriver driver;
  private WebDriverWait wait;
  private final String baseUrl = System.getProperty("maracita.baseUrl", "https://maracita.awadi-mar34.workers.dev");

  @BeforeEach
  void openBrowser() {
    ChromeOptions options = new ChromeOptions();
    options.addArguments("--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--window-size=1440,1200");
    driver = new ChromeDriver(options);
    wait = new WebDriverWait(driver, Duration.ofSeconds(25));
  }

  @AfterEach
  void closeBrowser() { if (driver != null) driver.quit(); }

  @Test
  void landingPageShowsProductAndDemoEntryPoint() {
    driver.get(baseUrl + "/");
    wait.until(ExpectedConditions.visibilityOfElementLocated(By.tagName("main")));
    assertTrue(driver.getTitle().contains("Maracita"));
    assertTrue(driver.findElement(By.tagName("body")).getText().contains("Your business day"));
    assertTrue(driver.findElement(By.linkText("Explore the portfolio demo")).isDisplayed());
  }

  @Test
  void portfolioDemoOpensProtectedWorkspace() {
    driver.get(baseUrl + "/demo");
    wait.until(ExpectedConditions.urlContains("/workspace"));
    assertTrue(driver.findElement(By.tagName("body")).getText().contains("MARACITA"));
    assertTrue(driver.findElement(By.linkText("Quality check")).isDisplayed());
  }
}
