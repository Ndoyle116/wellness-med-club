import asyncio, os, json, uuid
from pathlib import Path
from playwright.async_api import async_playwright

SS = Path(__file__).parent / "screenshots"
SS.mkdir(parents=True, exist_ok=True)
BASE = "http://localhost:8080"
PRODUCT_SLUG = "vit-d3-50k-caps"  # vitamins → no intake/labs → simplest cart

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={"width": 1280, "height": 1800})
        page = await ctx.new_page()
        page.on("console", lambda m: print("[console]", m.type, m.text[:200]) if m.type in ("error","warning") else None)

        # --- Fresh, unauthenticated context ---
        await page.goto(BASE)
        await page.evaluate("window.localStorage.clear(); window.sessionStorage.clear();")
        await ctx.clear_cookies()

        # ============================================================
        # PART 1: unauth /checkout must bounce to /login?redirect=/checkout
        # ============================================================
        await page.goto(f"{BASE}/checkout", wait_until="domcontentloaded")
        await page.wait_for_url("**/login*", timeout=8000)
        url = page.url
        print("PART1 landed:", url)
        assert "/login" in url, f"expected /login, got {url}"
        assert "redirect=%2Fcheckout" in url or "redirect=/checkout" in url, (
            f"redirect search param missing: {url}"
        )
        await page.screenshot(path=str(SS/"1_login_with_redirect.png"))

        # Assert "Create account" link on /login preserves redirect
        signup_href = await page.locator('a:has-text("Create account")').first.get_attribute("href")
        print("signup link:", signup_href)
        assert signup_href and "redirect=" in signup_href, f"signup link lost redirect: {signup_href}"

        # ============================================================
        # PART 2: full e2e — signup, sign out, add to cart, checkout, login, back to /checkout
        # ============================================================
        email = f"e2e-{uuid.uuid4().hex[:10]}@test.local"
        password = "TestPass!2345"

        # Create user via supabase client in-page (uses the app's publishable key)
        await page.goto(BASE)
        signup_result = await page.evaluate(
            """async ({email,password}) => {
                const { supabase } = await import('/src/integrations/supabase/client.ts');
                const r = await supabase.auth.signUp({
                    email, password,
                    options: { data: { first_name: 'E2E', last_name: 'Test' } }
                });
                return { hasSession: !!r.data.session, error: r.error?.message ?? null };
            }""",
            {"email": email, "password": password},
        )
        print("signup:", signup_result)
        if signup_result.get("error"):
            print("SKIP part 2: signup error:", signup_result["error"])
            await browser.close(); return

        if not signup_result.get("hasSession"):
            print("SKIP part 2: email confirmation required (no session after signUp)")
            await browser.close(); return

        # Sign out to simulate the reported unauthenticated flow
        await page.evaluate(
            """async () => {
                const { supabase } = await import('/src/integrations/supabase/client.ts');
                await supabase.auth.signOut();
            }"""
        )
        await page.evaluate("window.localStorage.clear();")

        # Land on /checkout directly (already unauth) and complete login
        await page.goto(f"{BASE}/checkout", wait_until="domcontentloaded")
        await page.wait_for_url("**/login*", timeout=8000)
        await page.screenshot(path=str(SS/"2_login_after_checkout.png"))
        print("after checkout click:", page.url)
        assert "redirect=%2Fcheckout" in page.url or "redirect=/checkout" in page.url

        # Fill and submit login form
        await page.locator('input[type="email"]').fill(email)
        await page.locator('input[type="password"]').fill(password)
        await page.get_by_role("button", name="Sign In").click()

        # Must land on /checkout (NOT /account)
        await page.wait_for_url("**/checkout", timeout=10000)
        print("PART2 final url:", page.url)
        assert page.url.rstrip("/").endswith("/checkout"), f"expected /checkout, got {page.url}"
        await page.screenshot(path=str(SS/"3_final_checkout.png"))
        print("ALL ASSERTIONS PASSED")

        await browser.close()

asyncio.run(main())
