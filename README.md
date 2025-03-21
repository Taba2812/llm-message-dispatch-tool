# llm-message-dispatch-tool
A tool enabling users to define user and system messages and dispatch them to multiple LLMs

Setup:
- python3.11 -m venv .venv
- pip install -r requirements.txt

Deploy:
- cd backend/
- uvicorn main:app --host 0.0.0.0 --port 8000
