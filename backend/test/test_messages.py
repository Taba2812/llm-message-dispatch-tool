import json
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

@pytest.mark.skip(reason="Already tested and passed.")
def test_get_messages():
    response = client.get("/messages")
    assert response.status_code == 200

@pytest.mark.skip(reason="Already tested and passed.")
def test_get_message():
    message_id = "67d1702a69cb3b653a022f12"
    message_id_bad = "1"
    message_id_not = "67d1708d69cb3b653a022f13"

    response = client.get(f"/messages/{message_id}")
    response_bad = client.get(f"/messages/{message_id_bad}")
    response_not = client.get(f"/messages/{message_id_not}")

    assert response.status_code == 200
    assert response_bad.status_code == 400
    assert response_not.status_code == 404

@pytest.mark.skip(reason="Already tested and passed.")
def test_send_message():
    json_data = '''
    {
      "models": [
        "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
        "deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free"
      ],
      "messages": [
        {
          "role": "system",
          "content": "Explain to a five year old."
        },
        {
          "role": "user",
          "content": "What is quantum physics?"
        }
      ],
      "temperature": 0.5,
      "max_tokens": null
    }
    '''
    message_json = json.loads(json_data)
    response = client.post("/send-message", json=message_json)
    assert response.status_code == 201

@pytest.mark.skip(reason="Already tested and passed.")
def test_delete_message():
    # The ID will have to change to test again
    message_id = "67d1708d69cb3b653a022f13"
    response = client.delete(f"/messages/{message_id}")

    assert response.json() == {"message": f"Message {message_id} deleted successfully"}
    assert response.status_code == 200