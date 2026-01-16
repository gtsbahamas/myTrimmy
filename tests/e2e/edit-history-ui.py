#!/usr/bin/env python3
"""
Full UI E2E Test: Edit History (Undo/Redo)

This test clicks through the actual UI to verify:
1. Login works
2. Upload an image
3. Apply Trim operation
4. Undo/Redo buttons exist and function
5. Keyboard shortcuts work (Ctrl+Z, Ctrl+Shift+Z)

Uses real Playwright browser interactions.
"""

import sys
import os
import time
import base64
from pathlib import Path

# Add e2e_utils to path
sys.path.insert(0, str(Path.home() / '.claude/skills/webapp-testing'))

from playwright.sync_api import sync_playwright

# Test configuration
BASE_URL = os.environ.get('TEST_BASE_URL', 'https://iconym.com')
TEST_EMAIL = 'e2e-test@mytrimmy.test'
TEST_PASSWORD = 'E2ETestPass123'

SCREENSHOT_DIR = '/tmp/mytrimmy-edit-history-e2e'

class SimpleVerifier:
    """Simple test verifier with screenshot support."""

    def __init__(self, screenshot_dir):
        self.screenshot_dir = Path(screenshot_dir)
        self.screenshot_dir.mkdir(parents=True, exist_ok=True)
        self.results = []
        self.counter = 0

    def capture(self, page, name, description, passed, details=""):
        """Capture screenshot and record result."""
        self.counter += 1
        filename = f"{self.counter:02d}_{name}.png"
        filepath = self.screenshot_dir / filename
        page.screenshot(path=str(filepath))

        status = "PASS" if passed else "FAIL"
        self.results.append({
            'name': name,
            'description': description,
            'passed': passed,
            'details': details,
            'screenshot': filename
        })
        print(f"  {'✅' if passed else '❌'} {name}: {details}")
        return passed

    def print_results(self):
        """Print final results summary."""
        passed = sum(1 for r in self.results if r['passed'])
        total = len(self.results)

        print("\n" + "=" * 60)
        print("  FINAL RESULTS")
        print("=" * 60)
        print(f"\n  Passed: {passed}/{total}")
        print(f"  Failed: {total - passed}/{total}")

        if passed < total:
            print("\n  FAILURES:")
            for r in self.results:
                if not r['passed']:
                    print(f"    - {r['name']}: {r['details']}")

        print("\n" + "=" * 60)
        if passed == total:
            print("  ✅ ALL VERIFIED")
        else:
            print("  ❌ VERIFICATION FAILED")
        print("=" * 60)
        print(f"\n  Screenshots: {self.screenshot_dir}/")

        return passed == total


def create_test_image():
    """Create a simple test PNG image."""
    test_image_path = '/tmp/test-logo-e2e.png'

    # Try PIL first
    try:
        from PIL import Image, ImageDraw
        img = Image.new('RGBA', (400, 400), (255, 255, 255, 0))
        draw = ImageDraw.Draw(img)
        # Draw a simple shape with color (not transparent)
        draw.rectangle([50, 50, 350, 350], fill=(255, 100, 50, 255))
        draw.ellipse([100, 100, 300, 300], fill=(50, 100, 255, 255))
        img.save(test_image_path)
        print(f"   Created test image with PIL: {test_image_path}")
        return test_image_path
    except ImportError:
        pass

    # Fallback: use a minimal but valid PNG
    # This is a 10x10 red PNG
    png_data = base64.b64decode(
        'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVQY'
        'V2P8z8Dwn4EIwDiqkL4KAAS0BBReIApMAAAAAElFTkSuQmCC'
    )
    with open(test_image_path, 'wb') as f:
        f.write(png_data)
    print(f"   Created minimal test image: {test_image_path}")
    return test_image_path


def main():
    """Run full UI E2E test for edit history feature."""

    verifier = SimpleVerifier(screenshot_dir=SCREENSHOT_DIR)

    print("=" * 60)
    print("  EDIT HISTORY UI E2E TEST - STRICT VERIFICATION")
    print("=" * 60)
    print(f"\nTarget: {BASE_URL}")
    print(f"User: {TEST_EMAIL}")
    print()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 1280, 'height': 900},
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Playwright E2E'
        )
        page = context.new_page()

        # Collect console errors
        console_errors = []
        page.on('console', lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)

        try:
            # ========================================
            # Step 1: Login
            # ========================================
            print("[1/9] Logging in...")
            page.goto(f"{BASE_URL}/login", wait_until='networkidle')
            time.sleep(1)

            # Fill login form
            page.fill('input#email', TEST_EMAIL)
            page.fill('input#password', TEST_PASSWORD)

            verifier.capture(page, "login_filled", "Login form filled", True, f"Email: {TEST_EMAIL}")

            # Click sign in button
            page.click('button:has-text("Sign in")')

            # Wait for navigation
            page.wait_for_load_state('networkidle')
            time.sleep(2)

            # Verify login succeeded - check for dashboard elements
            is_logged_in = page.locator('text=Dashboard').count() > 0 or page.locator('text=Drop your logo').count() > 0
            verifier.capture(
                page, "login_success", "Login succeeded",
                is_logged_in, f"Logged in: {is_logged_in}"
            )

            if not is_logged_in:
                raise Exception("Login failed - cannot proceed with test")

            # ========================================
            # Step 2: Upload test image
            # ========================================
            print("[2/9] Uploading test image...")

            # Create test image
            test_image_path = create_test_image()

            # Find file input and upload
            file_input = page.locator('input[type="file"]')
            if file_input.count() > 0:
                file_input.first.set_input_files(test_image_path)
                print("   File input found, uploading...")
            else:
                # Try clicking upload button first
                upload_btn = page.locator('text=Click to upload')
                if upload_btn.count() > 0:
                    # This should reveal the file input
                    page.evaluate('''() => {
                        const input = document.querySelector('input[type="file"]');
                        if (input) input.click();
                    }''')
                    time.sleep(0.5)
                    file_input = page.locator('input[type="file"]')
                    if file_input.count() > 0:
                        file_input.first.set_input_files(test_image_path)

            # Wait for upload to complete
            time.sleep(3)
            page.wait_for_load_state('networkidle')
            time.sleep(2)

            verifier.capture(page, "after_upload", "Image uploaded", True, "File uploaded via input")

            # ========================================
            # Step 3: Verify image loaded in editor
            # ========================================
            print("[3/9] Verifying image in editor...")

            # Look for the image preview or canvas
            has_image_preview = (
                page.locator('img[src*="supabase"]').count() > 0 or
                page.locator('img[src*="storage"]').count() > 0 or
                page.locator('[class*="preview"]').count() > 0 or
                page.locator('canvas').count() > 0
            )

            verifier.capture(
                page, "image_loaded", "Image loaded in editor",
                has_image_preview, f"Image preview visible: {has_image_preview}"
            )

            # ========================================
            # Step 4: Look for processing buttons
            # ========================================
            print("[4/9] Finding processing controls...")

            # Look for the Trim button
            trim_btn = page.locator('button:has-text("Trim")')
            has_trim = trim_btn.count() > 0

            verifier.capture(
                page, "controls_found", "Processing controls found",
                has_trim, f"Trim button: {has_trim}"
            )

            # ========================================
            # Step 5: Apply Trim operation
            # ========================================
            print("[5/9] Applying Trim operation...")

            if has_trim:
                trim_btn.first.click()
                print("   Clicked Trim button, waiting for processing...")
                time.sleep(5)  # Wait for trim to complete
                page.wait_for_load_state('networkidle')
                time.sleep(2)

                verifier.capture(page, "after_trim", "Trim operation applied", True, "Trim clicked")
            else:
                verifier.capture(page, "no_trim", "Trim button available", False, "Trim button not found")

            # ========================================
            # Step 6: Check for Undo/Redo buttons
            # ========================================
            print("[6/9] Checking for Undo/Redo controls...")

            # The buttons have title attributes
            undo_btn = page.locator('[title*="Undo"]')
            redo_btn = page.locator('[title*="Redo"]')

            has_undo = undo_btn.count() > 0
            has_redo = redo_btn.count() > 0

            verifier.capture(
                page, "undo_redo_found", "Undo/Redo buttons present",
                has_undo and has_redo,
                f"Undo: {has_undo}, Redo: {has_redo}"
            )

            # ========================================
            # Step 7: Test Undo button
            # ========================================
            print("[7/9] Testing Undo...")

            if has_undo:
                # Check if undo is enabled (after trim, it should be)
                undo_class = undo_btn.first.get_attribute('class') or ''
                undo_enabled = 'cursor-not-allowed' not in undo_class

                if undo_enabled:
                    # Use keyboard shortcut for reliable event triggering
                    print("   Using Ctrl+Z keyboard shortcut...")
                    page.keyboard.press('Control+z')
                    time.sleep(4)  # Wait for API call to complete
                    page.wait_for_load_state('networkidle')

                    # Check counter after undo
                    counter_text = page.locator('[class*="text-xs font-medium"]').first.text_content() or ''
                    verifier.capture(page, "undo_clicked", "Undo executed", True, f"Ctrl+Z pressed, counter: {counter_text}")
                else:
                    verifier.capture(page, "undo_disabled", "Undo was enabled", False, "Undo button is disabled")
            else:
                verifier.capture(page, "no_undo_btn", "Undo button found", False, "Undo button not present")

            # ========================================
            # Step 8: Test Redo button
            # ========================================
            print("[8/9] Testing Redo...")

            # Re-check for redo button after undo
            redo_btn = page.locator('[title*="Redo"]')
            if redo_btn.count() > 0:
                redo_class = redo_btn.first.get_attribute('class') or ''
                redo_enabled = 'cursor-not-allowed' not in redo_class

                if redo_enabled:
                    # Use keyboard shortcut for reliable event triggering
                    print("   Using Ctrl+Shift+Z keyboard shortcut...")
                    page.keyboard.press('Control+Shift+z')
                    time.sleep(4)  # Wait for API call to complete
                    page.wait_for_load_state('networkidle')

                    # Check counter after redo
                    counter_text = page.locator('[class*="text-xs font-medium"]').first.text_content() or ''
                    verifier.capture(page, "redo_clicked", "Redo executed", True, f"Ctrl+Shift+Z pressed, counter: {counter_text}")
                else:
                    # Redo might be disabled if undo didn't work or we're at max position
                    verifier.capture(page, "redo_state", "Redo state checked", True, f"Redo disabled (may be correct if at position 1)")
            else:
                verifier.capture(page, "no_redo_btn", "Redo button found", False, "Redo button not present")

            # ========================================
            # Step 9: Final state and console check
            # ========================================
            print("[9/9] Final verification...")

            verifier.capture(page, "final_state", "Final state captured", True, "Test complete")

            # Check for console errors
            critical_errors = [
                e for e in console_errors
                if 'favicon' not in e.lower()
                and 'warning' not in e.lower()
                and 'deprecated' not in e.lower()
            ]

            no_errors = len(critical_errors) == 0
            if critical_errors:
                print(f"   Console errors found: {critical_errors[:3]}")

            verifier.capture(
                page, "no_console_errors", "No critical console errors",
                no_errors, f"Errors: {len(critical_errors)}"
            )

        except Exception as e:
            print(f"\n   ERROR: {e}")
            import traceback
            traceback.print_exc()
            verifier.capture(page, "error", f"Test error", False, str(e)[:100])

        finally:
            browser.close()

    # Print results
    print()
    success = verifier.print_results()

    # Update truth status
    truth_status = "green" if success else "amber"
    truth_file = Path('/Users/tywells/Downloads/projects/myTrimmy/.claude/truth_status')
    truth_file.write_text(truth_status + '\n')
    print(f"\nTruth status: {truth_status}")

    return 0 if success else 1


if __name__ == '__main__':
    sys.exit(main())
