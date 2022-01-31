docker compose --env-file .env.development config
docker-compose --env-file .env.development up

**Redis**

- run redis with via docker compose
- docker exec -it <container_name> sh
- redis-cli
- get all keys -> keys '\*'
- find keys with pattern -> keys \*\_refToken
