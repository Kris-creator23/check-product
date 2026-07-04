# Что делать дальше

Это уже не GitHub Pages-сайт. Здесь есть backend, поэтому проект нужно размещать на Vercel или похожем сервисе.

## 1. Что внутри

- сайт Check на финском
- регистрация через Supabase
- Google login
- email login
- 7 дней trial без платежных данных
- Stripe Checkout для подписок
- Basic / Pro / Premium
- запрос invoice на компанию
- личный кабинет
- ссылка на скачивание Mac-приложения
- endpoint для Mac-приложения, чтобы проверить активна ли лицензия

## 2. Что нужно создать вручную

### Supabase

1. Создать проект в Supabase.
2. В SQL Editor вставить и запустить файл `supabase/schema.sql`.
3. Включить Email auth.
4. Включить Google auth.
5. Добавить redirect URL:
   - локально: `http://localhost:3000/dashboard`
   - потом production URL с Vercel.

### Stripe

1. Создать продукты:
   - Check Basic, 19 EUR/month
   - Check Pro, 39 EUR/month
   - Check Premium, 89 EUR/month
2. Скопировать Stripe Price ID в `.env.local`.
3. Настроить webhook:
   - `/api/webhooks/stripe`
4. Включить события:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

### Mac app download

Сначала можно загрузить Mac-приложение в GitHub Releases и поставить ссылку в:

```text
NEXT_PUBLIC_MAC_DOWNLOAD_URL=
```

## 3. Как запустить локально

```bash
npm install
cp .env.example .env.local
npm run dev
```

Потом открыть:

```text
http://localhost:3000
```

## 4. Как развернуть

1. Создать новый GitHub repository для этой версии.
2. Загрузить туда все файлы из папки `check-product`.
3. Подключить repository к Vercel.
4. В Vercel добавить environment variables из `.env.example`.
5. После деплоя добавить production URL в Supabase redirects и Stripe webhook.

## 5. Важно

Старый GitHub Pages сайт можно оставить временно, но полноценный продукт с регистрацией и оплатой должен работать через Vercel, потому что GitHub Pages не умеет backend.
