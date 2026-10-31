sudo docker compose down
sudo docker compose build --no-cache app
docker compose up -d --force-recreate app
sudo docker compose up -d
