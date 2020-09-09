docker-compose up -d --build
docker cp lambda-layer-python:python.zip ./
docker-compose down
