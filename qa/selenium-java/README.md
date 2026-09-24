# Selenium + Java WebDriver

Real browser automation for the deployed Maracita portfolio.

The suite opens Chrome headlessly and verifies:

- The public landing page, title and portfolio-demo entry point.
- The portfolio demo redirects into a protected workspace.
- The in-product Quality Check entry point is available after the demo session starts.

Run locally after installing Java 17+, Maven and Chrome:

```bash
cd qa/selenium-java
mvn test -Dmaracita.baseUrl=https://maracita.awadi-mar34.workers.dev
```

Selenium Manager resolves the compatible Chrome WebDriver automatically. The same suite runs in GitHub Actions on every push and pull request.
