"""
Minimal test to verify social_connect router works independently
"""
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

# Set test API key
import os
os.environ['LATE_API_KEY'] = 'test_key_for_validation'

from fastapi import FastAPI
from fastapi.testclient import TestClient
from routers.account import router

# Create minimal app with just our router
app = FastAPI()
app.include_router(router)

# Test client
client = TestClient(app)

def test_start_endpoint():
    """Test POST /connect-social/start accepts JSON body"""
    response = client.post(
        "/connect-social/start",
        json={"platform": "tiktok", "user_id": "test-user"}
    )
    
    # We expect 503 because Late API is unreachable, but the endpoint should work
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    # Check it's a proper error response (503 for network issue, not 422 for validation)
    assert response.status_code in [503, 200], f"Expected 503 or 200, got {response.status_code}"
    print("✅ Endpoint accepts JSON body correctly")

def test_validation():
    """Test platform validation"""
    response = client.post(
        "/connect-social/start",
        json={"platform": "invalid_platform"}
    )
    
    assert response.status_code == 400
    assert "Unsupported platform" in response.json()["detail"]
    print("✅ Platform validation works")

def test_missing_platform():
    """Test missing platform field"""
    response = client.post(
        "/connect-social/start",
        json={"user_id": "test"}
    )
    
    assert response.status_code == 422
    print("✅ Validation requires platform field")

if __name__ == "__main__":
    print("Testing social_connect router endpoints...\n")
    
    try:
        test_missing_platform()
        test_validation()
        test_start_endpoint()
        print("\n🎉 All endpoint tests passed!")
        print("\nNote: 503 error is expected since Late API is unreachable.")
        print("With valid LATE_API_KEY and internet, it should return 200.")
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
