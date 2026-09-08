-- Только стандартная локальная учебная установка. Запускается через psql
-- от администратора PostgreSQL: его пароль запрашивается самим psql и
-- не записывается ни в файл, ни в команду запуска.
-- Существующую роль/базу не удаляем и их пароли не меняем.
SELECT 'CREATE ROLE creatur LOGIN PASSWORD ''creatur'''
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'creatur')
\gexec
SELECT 'CREATE DATABASE creatur OWNER creatur'
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'creatur')
\gexec
