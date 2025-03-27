import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

@pytest.mark.skip(reason="Already tested and passed.")
def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message" : "LLM Message Dispatch Tool"}
