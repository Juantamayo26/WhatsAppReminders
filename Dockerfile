FROM public.ecr.aws/docker/library/node:18.13.0

WORKDIR /var/www

COPY . .

RUN npm ci

EXPOSE 3000

CMD npm run start