# llm-message-dispatch-tool
A tool enabling users to define user and system messages and dispatch them to multiple LLMs

Backend Setup:
- python3.* -m venv .venv
- source .venv/bin/activate
- pip install -r requirements.txt

Backend Deployment:
- cd backend/
- uvicorn main:app --host 0.0.0.0 --port 8000

Frontend Setup:
- curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
- restart terminal
- nvm install 20
- nvm alias default 20 (to make it default)
- nvm use 20
- npm install