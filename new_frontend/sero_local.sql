--
-- PostgreSQL database dump
--

\restrict HqehLCRCfwq5DPC7JG8gh6Ozs67Sg32a8acmSE3UdXHrWFcmaIC0gRnrg97Pips

-- Dumped from database version 18.4 (Ubuntu 18.4-0ubuntu0.26.04.1)
-- Dumped by pg_dump version 18.4 (Ubuntu 18.4-0ubuntu0.26.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin (
    id integer NOT NULL,
    username text NOT NULL,
    hashed_password text NOT NULL,
    active_token text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.admin OWNER TO postgres;

--
-- Name: admin_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admin_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admin_id_seq OWNER TO postgres;

--
-- Name: admin_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admin_id_seq OWNED BY public.admin.id;


--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO postgres;

--
-- Name: category; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.category (
    id integer NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text NOT NULL,
    image_url text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.category OWNER TO postgres;

--
-- Name: category_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.category_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.category_id_seq OWNER TO postgres;

--
-- Name: category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.category_id_seq OWNED BY public.category.id;


--
-- Name: currency; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.currency (
    id integer NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    rate_to_kes numeric(20,6) NOT NULL,
    is_active boolean NOT NULL,
    last_updated timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.currency OWNER TO postgres;

--
-- Name: currency_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.currency_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.currency_id_seq OWNER TO postgres;

--
-- Name: currency_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.currency_id_seq OWNED BY public.currency.id;


--
-- Name: order; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."order" (
    id integer NOT NULL,
    customer_name text NOT NULL,
    customer_email text NOT NULL,
    customer_phone text NOT NULL,
    delivery_address text NOT NULL,
    total_price numeric(10,2) NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    payment_method text,
    payment_status text DEFAULT 'unpaid'::text NOT NULL,
    merchant_reference text,
    mpesa_checkout_request_id text,
    currency text DEFAULT 'KES'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    paypal_order_id text
);


ALTER TABLE public."order" OWNER TO postgres;

--
-- Name: order_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_id_seq OWNER TO postgres;

--
-- Name: order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_id_seq OWNED BY public."order".id;


--
-- Name: order_item; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_item (
    id integer NOT NULL,
    order_id integer NOT NULL,
    product_id integer NOT NULL,
    variant_id integer,
    quantity integer NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.order_item OWNER TO postgres;

--
-- Name: order_item_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_item_id_seq OWNER TO postgres;

--
-- Name: order_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_item_id_seq OWNED BY public.order_item.id;


--
-- Name: payment_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_log (
    id integer NOT NULL,
    order_id integer NOT NULL,
    provider text NOT NULL,
    event_type text NOT NULL,
    raw_payload text,
    provider_reference text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.payment_log OWNER TO postgres;

--
-- Name: payment_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payment_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payment_log_id_seq OWNER TO postgres;

--
-- Name: payment_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payment_log_id_seq OWNED BY public.payment_log.id;


--
-- Name: product; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product (
    id integer NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text NOT NULL,
    image_url text NOT NULL,
    is_customisable boolean NOT NULL,
    price numeric(10,2) NOT NULL,
    is_on_discount boolean NOT NULL,
    discount_percentage numeric,
    stock integer NOT NULL,
    is_active boolean NOT NULL,
    category_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    initial_stock integer
);


ALTER TABLE public.product OWNER TO postgres;

--
-- Name: product_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.product_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_id_seq OWNER TO postgres;

--
-- Name: product_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.product_id_seq OWNED BY public.product.id;


--
-- Name: variant; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.variant (
    id integer NOT NULL,
    product_id integer NOT NULL,
    size text NOT NULL,
    colour text NOT NULL,
    stock integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.variant OWNER TO postgres;

--
-- Name: variant_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.variant_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.variant_id_seq OWNER TO postgres;

--
-- Name: variant_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.variant_id_seq OWNED BY public.variant.id;


--
-- Name: admin id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin ALTER COLUMN id SET DEFAULT nextval('public.admin_id_seq'::regclass);


--
-- Name: category id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.category ALTER COLUMN id SET DEFAULT nextval('public.category_id_seq'::regclass);


--
-- Name: currency id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.currency ALTER COLUMN id SET DEFAULT nextval('public.currency_id_seq'::regclass);


--
-- Name: order id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."order" ALTER COLUMN id SET DEFAULT nextval('public.order_id_seq'::regclass);


--
-- Name: order_item id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_item ALTER COLUMN id SET DEFAULT nextval('public.order_item_id_seq'::regclass);


--
-- Name: payment_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_log ALTER COLUMN id SET DEFAULT nextval('public.payment_log_id_seq'::regclass);


--
-- Name: product id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product ALTER COLUMN id SET DEFAULT nextval('public.product_id_seq'::regclass);


--
-- Name: variant id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.variant ALTER COLUMN id SET DEFAULT nextval('public.variant_id_seq'::regclass);


--
-- Data for Name: admin; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin (id, username, hashed_password, active_token, created_at, updated_at) FROM stdin;
1	admin	$2b$12$Vq0y9Jn95TVvrH4yMCJi/usjXmvdVbJ.KGPKtPK0ZSJDe//quWjty	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImV4cCI6MTc4MTc1MzY3M30.FxOXVCNGN_SpfJlILSPC97j_Es0Iv0ZXVAPuMkbYOLk	2026-06-11 15:02:10.406772	2026-06-11 15:02:10.406772
\.


--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alembic_version (version_num) FROM stdin;
d90af8a864a2
\.


--
-- Data for Name: category; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.category (id, name, slug, description, image_url, created_at, updated_at) FROM stdin;
2	The Nomad Collection	Nomad	Crafted for journeys near and far, The Nomad Collection celebrates Africa's ancient spirit of movement and discovery. Built for modern explorers, every piece carries the marks of adventure while growing richer with every mile traveled.	/uploads/31b9ef91-0936-4812-925b-6fac55d23e09.webp	2026-06-15 05:14:31.530336	2026-06-15 05:14:31.530336
3	The Heritage Collection	Heritage	Inspired by generations of makers, traders, and leaders, The Heritage Collection honors timeless craftsmanship. These are pieces designed to outlive trends and become part of personal legacies.	/uploads/8d688387-07ce-49e8-9cc6-8a1a92ee775f.webp	2026-06-15 05:16:06.28535	2026-06-15 05:16:06.28535
4	The Artisan Collection	Artisan	Every stitch tells a story. The Artisan Collection showcases the highest expression of handcraft, where skilled hands transform raw leather into functional works of art.	/uploads/8a0667d4-ad43-481b-bce5-e61b1cadc410.webp	2026-06-15 05:17:53.188723	2026-06-15 05:17:53.188723
5	The Savannah Collection	Savannah	Vast landscapes. Endless horizons. The Savannah Collection blends strength and simplicity into pieces made for daily life while carrying the soul of Africa's open plains.	/uploads/77267159-a13b-42a9-98ea-923c2f13b077.webp	2026-06-15 05:19:50.651002	2026-06-15 05:19:50.651002
6	Vouchers	VOUCHERS	Exclusive SERO vouchers designed to introduce new customers to our collections, reward loyal patrons, and offer thoughtful gifts for those who appreciate exceptional craftsmanship.	/uploads/4cf9c6f7-8674-4a1c-aaa7-fefdf5bf347d.webp	2026-06-15 07:02:06.931813	2026-06-15 07:02:06.931813
\.


--
-- Data for Name: currency; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.currency (id, code, name, rate_to_kes, is_active, last_updated, created_at) FROM stdin;
1	USD	US Dollar	0.007726	t	2026-06-17 22:50:55.339036	2026-06-15 04:06:44.346977
2	EUR	Euro	0.006660	t	2026-06-17 22:50:55.339054	2026-06-15 04:45:45.350831
3	CAD	Canadian Dollar	0.010812	t	2026-06-17 22:50:55.33906	2026-06-15 10:32:57.071794
\.


--
-- Data for Name: order; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."order" (id, customer_name, customer_email, customer_phone, delivery_address, total_price, status, payment_method, payment_status, merchant_reference, mpesa_checkout_request_id, currency, created_at, updated_at, paypal_order_id) FROM stdin;
7	Michael Oduke	odukem622@gmail.com	254741102421	Juja, Nairobi - Near JKUAT GATE A	25998.00	pending	mpesa	unpaid	a04091f5-10bc-460b-bc0d-f9d30e306258	ws_CO_15062026013456045741102421	KES	2026-06-15 01:34:54.660143	2026-06-15 01:34:54.660143	\N
15	Michael Oduke 	odukem622@gmail.com	254741102421	Juja	38501.00	Cancelled	mpesa	failed	64625356-b7d4-4e95-964e-c0e000ff1ca6	ws_CO_15062026113516520741102421	KES	2026-06-15 11:35:14.037465	2026-06-15 11:35:14.037465	\N
8	Michael Oduke	odukem622@gmail.com	254741102421	Juja, Nairobi - near JKUAT GATE A	4.00	confirmed	mpesa	paid	2479be76-eec2-4aab-9481-50c74b91c018	ws_CO_15062026014013215741102421	KES	2026-06-15 01:40:11.868143	2026-06-15 01:40:11.868143	\N
14	Michael Oduke	arenvassil@gmail.com	254741102421	Kiboswa, Kisumu\nopp Nyang'ori Highschool	1.00	Cancelled	mpesa	failed	71098557-988d-434c-aeec-ce2e8f0912bf	ws_CO_15062026113216102741102421	KES	2026-06-15 11:32:14.580298	2026-06-15 11:32:14.580298	\N
9	Michael Oduke	arenvassil@gmail.com	254741102421	Kiboswa, Kisumu\nopp Nyang'ori Highschool	51998.00	pending	mpesa	failed	4a5f8b57-6cad-438e-9e1b-2521539e759e	ws_CO_15062026023404426741102421	KES	2026-06-15 02:34:02.337594	2026-06-15 02:34:02.337594	\N
10	Michael Oduke	arenvassil@gmail.com	254741102421	Kiboswa, Kisumu\nopp Nyang'ori Highschool	4.00	pending	paypal	unpaid	90246f6c-51e0-4d4d-a247-282e19ebb3ad	\N	KES	2026-06-15 02:52:47.54473	2026-06-15 02:52:47.54473	4BJ72101AB198551F
16	Michael Oduke 	odukem622@gmail.com	254741102421	Juja, Nairobi - near JKUAT GATE A	5.00	Delivered	mpesa	paid	dd3e35b7-7dae-441d-8940-a2bedcdcf157	ws_CO_15062026125757829741102421	KES	2026-06-15 12:57:55.980882	2026-06-15 12:57:55.980882	\N
13	Michael Oduke	arenvassil@gmail.com	254741102421	Kiboswa, Kisumu\nopp Nyang'ori Highschool	1.00	Delivered	mpesa	failed	22921682-1bad-4564-ac77-b8888a160bdc	ws_CO_15062026110357771741102421	KES	2026-06-15 11:03:55.688634	2026-06-15 11:03:55.688634	\N
12	Michael Oduke 	odukem622@gmail.com	254741102421	Juja, Nairobi - Near JKUAT GATE A	1.00	Cancelled	mpesa	failed	3de012b8-15a0-4cab-9fbd-43a150ab0267	ws_CO_15062026031618541741102421	KES	2026-06-15 03:16:16.59064	2026-06-15 03:16:16.59064	\N
11	Michael Oduke	arenvassil@gmail.com	254741102421	Kiboswa, Kisumu\nopp Nyang'ori Highschool	4.00	Cancelled	paypal	unpaid	45e295ae-8e71-4d2e-af00-b98c0e8feb1b	\N	KES	2026-06-15 02:56:14.067424	2026-06-15 02:56:14.067424	0KG538472G081491K
25	Michael Oduke	arenvassil@gmail.com	254741102421	Kiboswa, Kisumu\nopp Nyang'ori Highschool	1.00	confirmed	mpesa	paid	2f8fd7ac-d12d-4329-bbbd-f34e9197ad72	ws_CO_15062026140216521741102421	KES	2026-06-15 14:02:15.025546	2026-06-15 14:02:15.025546	\N
26	Michael Oduke	arenvassil@gmail.com	254741102421	Kiboswa, Kisumu\nopp Nyang'ori Highschool	1.00	confirmed	mpesa	paid	115ef739-2997-40bd-a99f-0ae8859e8588	ws_CO_15062026140401211741102421	KES	2026-06-15 14:03:59.653248	2026-06-15 14:03:59.653248	\N
19	Michael Oduke	arenvassil@gmail.com	254741102421	Kiboswa, Kisumu\nopp Nyang'ori Highschool	5.00	Delivered	paypal	unpaid	1eabe41c-2ca1-423d-8c39-905ac39981f3	\N	KES	2026-06-15 13:10:21.989749	2026-06-15 13:10:21.989749	\N
18	Michael Oduke	arenvassil@gmail.com	254741102421	Kiboswa, Kisumu\nopp Nyang'ori Highschool	5.00	Delivered	mpesa	paid	494cdc63-cea3-44e8-8a65-77424a80a1aa	ws_CO_15062026130949875741102421	KES	2026-06-15 13:09:48.290705	2026-06-15 13:09:48.290705	\N
17	Michael Oduke	arenvassil@gmail.com	254741102421	Kiboswa, Kisumu\nopp Nyang'ori Highschool	5.00	Delivered	paypal	unpaid	cf7f040e-1d7f-4951-8a1e-a0cedac158e6	\N	KES	2026-06-15 13:09:35.807737	2026-06-15 13:09:35.807737	\N
20	Michael Oduke	arenvassil@gmail.com	254741102421	Kiboswa, Kisumu\nopp Nyang'ori Highschool	5.00	pending	paypal	unpaid	2bd43d85-3d72-4555-9dd9-3e9c2abc811f	\N	KES	2026-06-15 13:12:51.003707	2026-06-15 13:12:51.003707	\N
21	Michael Oduke 	odukem622@gmail.com	254741102421	Kilimani, near BNB	1.00	pending	paypal	unpaid	52452e35-5188-44d2-843c-7e4ecb3c2625	\N	KES	2026-06-15 13:25:30.05686	2026-06-15 13:25:30.05686	\N
22	Michael Oduke 	odukem622@gmail.com	254741102421	Kilimani, Nairobi - near Junction mall	1.00	pending	paypal	unpaid	39646576-819b-4e65-89c3-24b17e7d7c39	\N	KES	2026-06-15 13:29:23.562477	2026-06-15 13:29:23.562477	1PM75286GD2425305
23	Michael Oduke 	odukem622@gmail.com	254741102421	Juja, Nairobi - near JKUAT Gate A	11.00	pending	paypal	unpaid	60bf0ef0-e5a2-4804-a030-c5577016e6f6	\N	KES	2026-06-15 13:43:24.864315	2026-06-15 13:43:24.864315	2YH64141XF2506934
24	Jamal Mustapha	drbogdanivanovichkrilov@gmail.com	254711491434	Mamboleo, Kisumu - Opposite Showground	12500.00	pending	paypal	unpaid	624c33e6-44a9-45f4-b683-39cd0d7c703b	\N	KES	2026-06-15 13:46:35.288188	2026-06-15 13:46:35.288188	3U0570061Y015911B
27	Michael Oduke	arenvassil@gmail.com	254741102421	Kiboswa, Kisumu\nopp Nyang'ori Highschool	1.00	pending	paypal	unpaid	05f4a038-a452-4949-a18c-5d4e3a03974b	\N	KES	2026-06-15 14:04:32.866644	2026-06-15 14:04:32.866644	92V27937X5240493Y
30	Michael Oduke 	odukem622@gmail.com	254741102421	Juja	1.00	confirmed	mpesa	paid	d94fc665-523c-4dd1-b1db-45dc9c3c50a6	ws_CO_15062026161230509741102421	KES	2026-06-15 16:12:28.915371	2026-06-15 16:12:28.915371	\N
28	Wayne Serem	wayneserem@gmail.com	254797313208	Juja, Nairobi - near JKUAT Gate C	20.00	confirmed	mpesa	paid	0da8b3fb-cb06-4ebd-9505-1681f92557a8	ws_CO_15062026142906688797313208	KES	2026-06-15 14:29:05.306591	2026-06-15 14:29:05.306591	\N
29	Michael Oduke 	odukem622@gmail.com	254741102421	Juja	1.00	pending	mpesa	unpaid	2afec899-af0a-4b0c-96ff-3c169ae812e9	ws_CO_15062026155839082741102421	KES	2026-06-15 15:58:37.255262	2026-06-15 15:58:37.255262	\N
31	Michael Oduke	arenvassil@gmail.com	254741102421	Kiboswa, Kisumu\nopp Nyang'ori Highschool	1.00	pending	mpesa	unpaid	4d07e19b-dfc6-4918-95f3-9e493d1fe230	ws_CO_17062026195301768741102421	KES	2026-06-17 19:53:00.108609	2026-06-17 19:53:00.108609	\N
32	Michael Oduke	arenvassil@gmail.com	254741102421	Kiboswa, Kisumu\nopp Nyang'ori Highschool	1.00	pending	mpesa	failed	6d678448-bd12-45df-a17d-cc37e5a28f27	ws_CO_17062026195619282741102421	KES	2026-06-17 19:56:17.527805	2026-06-17 19:56:17.527805	\N
33	Michael Oduke	arenvassil@gmail.com	254741102421	Kiboswa, Kisumu\nopp Nyang'ori Highschool	49500.00	Delivered	paypal	unpaid	35f1789d-5488-48a0-a677-c4869415d5e9	\N	KES	2026-06-17 19:57:50.251567	2026-06-17 19:57:50.251567	67B31135KR9166154
\.


--
-- Data for Name: order_item; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_item (id, order_id, product_id, variant_id, quantity, unit_price, created_at, updated_at) FROM stdin;
8	13	23	\N	1	1.00	2026-06-15 11:03:55.688634	2026-06-15 11:03:55.688634
9	14	23	\N	1	1.00	2026-06-15 11:32:14.580298	2026-06-15 11:32:14.580298
10	15	8	\N	1	38500.00	2026-06-15 11:35:14.037465	2026-06-15 11:35:14.037465
11	15	22	\N	1	1.00	2026-06-15 11:35:14.037465	2026-06-15 11:35:14.037465
12	16	22	\N	5	1.00	2026-06-15 12:57:55.980882	2026-06-15 12:57:55.980882
13	17	22	\N	5	1.00	2026-06-15 13:09:35.807737	2026-06-15 13:09:35.807737
14	18	22	\N	5	1.00	2026-06-15 13:09:48.290705	2026-06-15 13:09:48.290705
15	19	23	\N	5	1.00	2026-06-15 13:10:21.989749	2026-06-15 13:10:21.989749
16	20	23	\N	5	1.00	2026-06-15 13:12:51.003707	2026-06-15 13:12:51.003707
17	21	23	\N	1	1.00	2026-06-15 13:25:30.05686	2026-06-15 13:25:30.05686
18	22	23	\N	1	1.00	2026-06-15 13:29:23.562477	2026-06-15 13:29:23.562477
19	23	23	\N	1	1.00	2026-06-15 13:43:24.864315	2026-06-15 13:43:24.864315
20	23	24	\N	10	1.00	2026-06-15 13:43:24.864315	2026-06-15 13:43:24.864315
21	24	14	\N	1	12500.00	2026-06-15 13:46:35.288188	2026-06-15 13:46:35.288188
22	25	24	\N	1	1.00	2026-06-15 14:02:15.025546	2026-06-15 14:02:15.025546
23	26	22	\N	1	1.00	2026-06-15 14:03:59.653248	2026-06-15 14:03:59.653248
24	27	24	\N	1	1.00	2026-06-15 14:04:32.866644	2026-06-15 14:04:32.866644
25	28	23	\N	10	1.00	2026-06-15 14:29:05.306591	2026-06-15 14:29:05.306591
26	28	24	\N	10	1.00	2026-06-15 14:29:05.306591	2026-06-15 14:29:05.306591
27	29	22	\N	1	1.00	2026-06-15 15:58:37.255262	2026-06-15 15:58:37.255262
28	30	22	\N	1	1.00	2026-06-15 16:12:28.915371	2026-06-15 16:12:28.915371
29	31	24	\N	1	1.00	2026-06-17 19:53:00.108609	2026-06-17 19:53:00.108609
30	32	24	\N	1	1.00	2026-06-17 19:56:17.527805	2026-06-17 19:56:17.527805
31	33	9	\N	1	49500.00	2026-06-17 19:57:50.251567	2026-06-17 19:57:50.251567
\.


--
-- Data for Name: payment_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment_log (id, order_id, provider, event_type, raw_payload, provider_reference, created_at) FROM stdin;
1	7	mpesa	initiate	{"MerchantRequestID": "da8b-4088-a71e-ab0f98f589c41381", "CheckoutRequestID": "ws_CO_15062026013456045741102421", "ResponseCode": "0", "ResponseDescription": "Success. Request accepted for processing", "CustomerMessage": "Success. Request accepted for processing"}	ws_CO_15062026013456045741102421	2026-06-15 01:34:54.660143
2	8	mpesa	initiate	{"MerchantRequestID": "7d5d-4d9f-953e-098c81552f7c97312", "CheckoutRequestID": "ws_CO_15062026014013215741102421", "ResponseCode": "0", "ResponseDescription": "Success. Request accepted for processing", "CustomerMessage": "Success. Request accepted for processing"}	ws_CO_15062026014013215741102421	2026-06-15 01:40:11.868143
3	8	mpesa	success	{"Body": {"stkCallback": {"MerchantRequestID": "7d5d-4d9f-953e-098c81552f7c97312", "CheckoutRequestID": "ws_CO_15062026014013215741102421", "ResultCode": 0, "ResultDesc": "The service request is processed successfully.", "CallbackMetadata": {"Item": [{"Name": "Amount", "Value": 4}, {"Name": "MpesaReceiptNumber", "Value": "UFF0J7WONN"}, {"Name": "Balance"}, {"Name": "TransactionDate", "Value": 20260615014026}, {"Name": "PhoneNumber", "Value": 254741102421}]}}}}	UFF0J7WONN	2026-06-15 01:40:28.004251
4	9	mpesa	initiate	{"MerchantRequestID": "da8b-4088-a71e-ab0f98f589c42427", "CheckoutRequestID": "ws_CO_15062026023404426741102421", "ResponseCode": "0", "ResponseDescription": "Success. Request accepted for processing", "CustomerMessage": "Success. Request accepted for processing"}	ws_CO_15062026023404426741102421	2026-06-15 02:34:02.337594
5	9	mpesa	failure	{"Body": {"stkCallback": {"MerchantRequestID": "da8b-4088-a71e-ab0f98f589c42427", "CheckoutRequestID": "ws_CO_15062026023404426741102421", "ResultCode": 1032, "ResultDesc": "Request Cancelled by user."}}}	\N	2026-06-15 02:34:18.064148
6	10	paypal	initiate	{"id": "4BJ72101AB198551F", "status": "CREATED", "links": [{"href": "https://api.sandbox.paypal.com/v2/checkout/orders/4BJ72101AB198551F", "rel": "self", "method": "GET"}, {"href": "https://www.sandbox.paypal.com/checkoutnow?token=4BJ72101AB198551F", "rel": "approve", "method": "GET"}, {"href": "https://api.sandbox.paypal.com/v2/checkout/orders/4BJ72101AB198551F", "rel": "update", "method": "PATCH"}, {"href": "https://api.sandbox.paypal.com/v2/checkout/orders/4BJ72101AB198551F/capture", "rel": "capture", "method": "POST"}]}	4BJ72101AB198551F	2026-06-15 02:52:47.627705
7	11	paypal	initiate	{"id": "0KG538472G081491K", "status": "CREATED", "links": [{"href": "https://api.sandbox.paypal.com/v2/checkout/orders/0KG538472G081491K", "rel": "self", "method": "GET"}, {"href": "https://www.sandbox.paypal.com/checkoutnow?token=0KG538472G081491K", "rel": "approve", "method": "GET"}, {"href": "https://api.sandbox.paypal.com/v2/checkout/orders/0KG538472G081491K", "rel": "update", "method": "PATCH"}, {"href": "https://api.sandbox.paypal.com/v2/checkout/orders/0KG538472G081491K/capture", "rel": "capture", "method": "POST"}]}	0KG538472G081491K	2026-06-15 02:56:14.120137
8	12	mpesa	initiate	{"MerchantRequestID": "da8b-4088-a71e-ab0f98f589c43074", "CheckoutRequestID": "ws_CO_15062026031618541741102421", "ResponseCode": "0", "ResponseDescription": "Success. Request accepted for processing", "CustomerMessage": "Success. Request accepted for processing"}	ws_CO_15062026031618541741102421	2026-06-15 03:16:16.59064
9	12	mpesa	failure	{"Body": {"stkCallback": {"MerchantRequestID": "da8b-4088-a71e-ab0f98f589c43074", "CheckoutRequestID": "ws_CO_15062026031618541741102421", "ResultCode": 1032, "ResultDesc": "Request Cancelled by user."}}}	\N	2026-06-15 03:16:25.466709
10	13	mpesa	initiate	{"MerchantRequestID": "7d5d-4d9f-953e-098c81552f7c115285", "CheckoutRequestID": "ws_CO_15062026110357771741102421", "ResponseCode": "0", "ResponseDescription": "Success. Request accepted for processing", "CustomerMessage": "Success. Request accepted for processing"}	ws_CO_15062026110357771741102421	2026-06-15 11:03:55.688634
11	13	mpesa	failure	{"Body": {"stkCallback": {"MerchantRequestID": "7d5d-4d9f-953e-098c81552f7c115285", "CheckoutRequestID": "ws_CO_15062026110357771741102421", "ResultCode": 1032, "ResultDesc": "Request Cancelled by user."}}}	\N	2026-06-15 11:04:04.776884
12	14	mpesa	initiate	{"MerchantRequestID": "7d5d-4d9f-953e-098c81552f7c116843", "CheckoutRequestID": "ws_CO_15062026113216102741102421", "ResponseCode": "0", "ResponseDescription": "Success. Request accepted for processing", "CustomerMessage": "Success. Request accepted for processing"}	ws_CO_15062026113216102741102421	2026-06-15 11:32:14.580298
13	14	mpesa	failure	{"Body": {"stkCallback": {"MerchantRequestID": "7d5d-4d9f-953e-098c81552f7c116843", "CheckoutRequestID": "ws_CO_15062026113216102741102421", "ResultCode": 1032, "ResultDesc": "Request Cancelled by user."}}}	\N	2026-06-15 11:32:22.61923
14	15	mpesa	initiate	{"MerchantRequestID": "5b7c-4c55-9fa2-7a794525cf7312603", "CheckoutRequestID": "ws_CO_15062026113516520741102421", "ResponseCode": "0", "ResponseDescription": "Success. Request accepted for processing", "CustomerMessage": "Success. Request accepted for processing"}	ws_CO_15062026113516520741102421	2026-06-15 11:35:14.037465
15	15	mpesa	failure	{"Body": {"stkCallback": {"MerchantRequestID": "5b7c-4c55-9fa2-7a794525cf7312603", "CheckoutRequestID": "ws_CO_15062026113516520741102421", "ResultCode": 1032, "ResultDesc": "Request Cancelled by user."}}}	\N	2026-06-15 11:35:22.950037
16	16	mpesa	initiate	{"MerchantRequestID": "7d5d-4d9f-953e-098c81552f7c121813", "CheckoutRequestID": "ws_CO_15062026125757829741102421", "ResponseCode": "0", "ResponseDescription": "Success. Request accepted for processing", "CustomerMessage": "Success. Request accepted for processing"}	ws_CO_15062026125757829741102421	2026-06-15 12:57:55.980882
17	16	mpesa	success	{"Body": {"stkCallback": {"MerchantRequestID": "7d5d-4d9f-953e-098c81552f7c121813", "CheckoutRequestID": "ws_CO_15062026125757829741102421", "ResultCode": 0, "ResultDesc": "The service request is processed successfully.", "CallbackMetadata": {"Item": [{"Name": "Amount", "Value": 5}, {"Name": "MpesaReceiptNumber", "Value": "UFF0J7Y0DK"}, {"Name": "Balance"}, {"Name": "TransactionDate", "Value": 20260615125803}, {"Name": "PhoneNumber", "Value": 254741102421}]}}}}	UFF0J7Y0DK	2026-06-15 12:58:05.974892
18	18	mpesa	initiate	{"MerchantRequestID": "5b7c-4c55-9fa2-7a794525cf7322755", "CheckoutRequestID": "ws_CO_15062026130949875741102421", "ResponseCode": "0", "ResponseDescription": "Success. Request accepted for processing", "CustomerMessage": "Success. Request accepted for processing"}	ws_CO_15062026130949875741102421	2026-06-15 13:09:48.290705
19	18	mpesa	success	{"Body": {"stkCallback": {"MerchantRequestID": "5b7c-4c55-9fa2-7a794525cf7322755", "CheckoutRequestID": "ws_CO_15062026130949875741102421", "ResultCode": 0, "ResultDesc": "The service request is processed successfully.", "CallbackMetadata": {"Item": [{"Name": "Amount", "Value": 5}, {"Name": "MpesaReceiptNumber", "Value": "UFF0J7Y0LP"}, {"Name": "Balance"}, {"Name": "TransactionDate", "Value": 20260615130958}, {"Name": "PhoneNumber", "Value": 254741102421}]}}}}	UFF0J7Y0LP	2026-06-15 13:10:00.339975
20	22	paypal	initiate	{"id": "1PM75286GD2425305", "status": "CREATED", "links": [{"href": "https://api.sandbox.paypal.com/v2/checkout/orders/1PM75286GD2425305", "rel": "self", "method": "GET"}, {"href": "https://www.sandbox.paypal.com/checkoutnow?token=1PM75286GD2425305", "rel": "approve", "method": "GET"}, {"href": "https://api.sandbox.paypal.com/v2/checkout/orders/1PM75286GD2425305", "rel": "update", "method": "PATCH"}, {"href": "https://api.sandbox.paypal.com/v2/checkout/orders/1PM75286GD2425305/capture", "rel": "capture", "method": "POST"}]}	1PM75286GD2425305	2026-06-15 13:29:23.600544
21	23	paypal	initiate	{"id": "2YH64141XF2506934", "status": "CREATED", "links": [{"href": "https://api.sandbox.paypal.com/v2/checkout/orders/2YH64141XF2506934", "rel": "self", "method": "GET"}, {"href": "https://www.sandbox.paypal.com/checkoutnow?token=2YH64141XF2506934", "rel": "approve", "method": "GET"}, {"href": "https://api.sandbox.paypal.com/v2/checkout/orders/2YH64141XF2506934", "rel": "update", "method": "PATCH"}, {"href": "https://api.sandbox.paypal.com/v2/checkout/orders/2YH64141XF2506934/capture", "rel": "capture", "method": "POST"}]}	2YH64141XF2506934	2026-06-15 13:43:24.964177
22	24	paypal	initiate	{"id": "3U0570061Y015911B", "status": "CREATED", "links": [{"href": "https://api.sandbox.paypal.com/v2/checkout/orders/3U0570061Y015911B", "rel": "self", "method": "GET"}, {"href": "https://www.sandbox.paypal.com/checkoutnow?token=3U0570061Y015911B", "rel": "approve", "method": "GET"}, {"href": "https://api.sandbox.paypal.com/v2/checkout/orders/3U0570061Y015911B", "rel": "update", "method": "PATCH"}, {"href": "https://api.sandbox.paypal.com/v2/checkout/orders/3U0570061Y015911B/capture", "rel": "capture", "method": "POST"}]}	3U0570061Y015911B	2026-06-15 13:46:35.336609
23	25	mpesa	initiate	{"MerchantRequestID": "5b7c-4c55-9fa2-7a794525cf7327178", "CheckoutRequestID": "ws_CO_15062026140216521741102421", "ResponseCode": "0", "ResponseDescription": "Success. Request accepted for processing", "CustomerMessage": "Success. Request accepted for processing"}	ws_CO_15062026140216521741102421	2026-06-15 14:02:15.025546
24	25	mpesa	success	{"Body": {"stkCallback": {"MerchantRequestID": "5b7c-4c55-9fa2-7a794525cf7327178", "CheckoutRequestID": "ws_CO_15062026140216521741102421", "ResultCode": 0, "ResultDesc": "The service request is processed successfully.", "CallbackMetadata": {"Item": [{"Name": "Amount", "Value": 1}, {"Name": "MpesaReceiptNumber", "Value": "UFF0J7Y77S"}, {"Name": "Balance"}, {"Name": "TransactionDate", "Value": 20260615140224}, {"Name": "PhoneNumber", "Value": 254741102421}]}}}}	UFF0J7Y77S	2026-06-15 14:02:26.468859
25	26	mpesa	initiate	{"MerchantRequestID": "5b7c-4c55-9fa2-7a794525cf7327338", "CheckoutRequestID": "ws_CO_15062026140401211741102421", "ResponseCode": "0", "ResponseDescription": "Success. Request accepted for processing", "CustomerMessage": "Success. Request accepted for processing"}	ws_CO_15062026140401211741102421	2026-06-15 14:03:59.653248
26	26	mpesa	success	{"Body": {"stkCallback": {"MerchantRequestID": "5b7c-4c55-9fa2-7a794525cf7327338", "CheckoutRequestID": "ws_CO_15062026140401211741102421", "ResultCode": 0, "ResultDesc": "The service request is processed successfully.", "CallbackMetadata": {"Item": [{"Name": "Amount", "Value": 1}, {"Name": "MpesaReceiptNumber", "Value": "UFF0J7Y33F"}, {"Name": "Balance"}, {"Name": "TransactionDate", "Value": 20260615140407}, {"Name": "PhoneNumber", "Value": 254741102421}]}}}}	UFF0J7Y33F	2026-06-15 14:04:08.907632
27	27	paypal	initiate	{"id": "92V27937X5240493Y", "status": "CREATED", "links": [{"href": "https://api.sandbox.paypal.com/v2/checkout/orders/92V27937X5240493Y", "rel": "self", "method": "GET"}, {"href": "https://www.sandbox.paypal.com/checkoutnow?token=92V27937X5240493Y", "rel": "approve", "method": "GET"}, {"href": "https://api.sandbox.paypal.com/v2/checkout/orders/92V27937X5240493Y", "rel": "update", "method": "PATCH"}, {"href": "https://api.sandbox.paypal.com/v2/checkout/orders/92V27937X5240493Y/capture", "rel": "capture", "method": "POST"}]}	92V27937X5240493Y	2026-06-15 14:04:32.927424
28	28	mpesa	initiate	{"MerchantRequestID": "7d5d-4d9f-953e-098c81552f7c125527", "CheckoutRequestID": "ws_CO_15062026142906688797313208", "ResponseCode": "0", "ResponseDescription": "Success. Request accepted for processing", "CustomerMessage": "Success. Request accepted for processing"}	ws_CO_15062026142906688797313208	2026-06-15 14:29:05.306591
29	28	mpesa	success	{"Body": {"stkCallback": {"MerchantRequestID": "7d5d-4d9f-953e-098c81552f7c125527", "CheckoutRequestID": "ws_CO_15062026142906688797313208", "ResultCode": 0, "ResultDesc": "The service request is processed successfully.", "CallbackMetadata": {"Item": [{"Name": "Amount", "Value": 20}, {"Name": "MpesaReceiptNumber", "Value": "UFFNP81BP8"}, {"Name": "Balance"}, {"Name": "TransactionDate", "Value": 20260615142923}, {"Name": "PhoneNumber", "Value": 254797313208}]}}}}	UFFNP81BP8	2026-06-15 14:29:24.718212
30	29	mpesa	initiate	{"MerchantRequestID": "7d5d-4d9f-953e-098c81552f7c130031", "CheckoutRequestID": "ws_CO_15062026155839082741102421", "ResponseCode": "0", "ResponseDescription": "Success. Request accepted for processing", "CustomerMessage": "Success. Request accepted for processing"}	ws_CO_15062026155839082741102421	2026-06-15 15:58:37.255262
31	30	mpesa	initiate	{"MerchantRequestID": "7d5d-4d9f-953e-098c81552f7c130749", "CheckoutRequestID": "ws_CO_15062026161230509741102421", "ResponseCode": "0", "ResponseDescription": "Success. Request accepted for processing", "CustomerMessage": "Success. Request accepted for processing"}	ws_CO_15062026161230509741102421	2026-06-15 16:12:28.915371
32	30	mpesa	success	{"Body": {"stkCallback": {"MerchantRequestID": "7d5d-4d9f-953e-098c81552f7c130749", "CheckoutRequestID": "ws_CO_15062026161230509741102421", "ResultCode": 0, "ResultDesc": "The service request is processed successfully.", "CallbackMetadata": {"Item": [{"Name": "Amount", "Value": 1}, {"Name": "MpesaReceiptNumber", "Value": "UFF0J7YQSC"}, {"Name": "Balance"}, {"Name": "TransactionDate", "Value": 20260615161236}, {"Name": "PhoneNumber", "Value": 254741102421}]}}}}	UFF0J7YQSC	2026-06-15 16:12:38.747382
33	31	mpesa	initiate	{"MerchantRequestID": "54a8-432e-b302-cf1d90c609dd73846", "CheckoutRequestID": "ws_CO_17062026195301768741102421", "ResponseCode": "0", "ResponseDescription": "Success. Request accepted for processing", "CustomerMessage": "Success. Request accepted for processing"}	ws_CO_17062026195301768741102421	2026-06-17 19:53:00.108609
34	32	mpesa	initiate	{"MerchantRequestID": "eb45-43b3-a3d4-218ee9f921eb26756", "CheckoutRequestID": "ws_CO_17062026195619282741102421", "ResponseCode": "0", "ResponseDescription": "Success. Request accepted for processing", "CustomerMessage": "Success. Request accepted for processing"}	ws_CO_17062026195619282741102421	2026-06-17 19:56:17.527805
35	32	mpesa	failure	{"Body": {"stkCallback": {"MerchantRequestID": "eb45-43b3-a3d4-218ee9f921eb26756", "CheckoutRequestID": "ws_CO_17062026195619282741102421", "ResultCode": 1037, "ResultDesc": "No response from user."}}}	\N	2026-06-17 19:56:45.651169
36	33	paypal	initiate	{"id": "67B31135KR9166154", "status": "CREATED", "links": [{"href": "https://api.sandbox.paypal.com/v2/checkout/orders/67B31135KR9166154", "rel": "self", "method": "GET"}, {"href": "https://www.sandbox.paypal.com/checkoutnow?token=67B31135KR9166154", "rel": "approve", "method": "GET"}, {"href": "https://api.sandbox.paypal.com/v2/checkout/orders/67B31135KR9166154", "rel": "update", "method": "PATCH"}, {"href": "https://api.sandbox.paypal.com/v2/checkout/orders/67B31135KR9166154/capture", "rel": "capture", "method": "POST"}]}	67B31135KR9166154	2026-06-17 19:57:50.310075
\.


--
-- Data for Name: product; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product (id, name, slug, description, image_url, is_customisable, price, is_on_discount, discount_percentage, stock, is_active, category_id, created_at, updated_at, initial_stock) FROM stdin;
8	NOMAD WEEKENDER DUFFEL	DUFFEL-BAG	The Nomad Weekender was designed for those who travel with purpose. Combining generous storage with timeless design, it is equally at home on a weekend escape to Naivasha as it is on an international flight.	/uploads/e2e33ab3-cbc4-4318-8290-96fa507f2996.webp	f	38500.00	f	0	8	t	2	2026-06-15 05:24:48.523506	2026-06-15 05:24:48.523506	8
9	NOMAD EXPEDITION DUFFEL	EXPED-DUFFEL	Built for longer journeys, the Expedition Duffel offers expanded capacity while maintaining the refined elegance of premium handcrafted leather.	/uploads/36531392-1669-4d27-aa40-2cf60be85b2d.webp	f	49500.00	f	0	5	t	2	2026-06-15 05:31:13.162252	2026-06-15 05:31:13.162252	5
10	NOMAD CARRY-ON HOLDALL	CARRY-ON	A sophisticated travel companion designed for modern mobility, featuring practical organization and enduring craftsmanship.	/uploads/8f5bb395-4e8d-4db9-85d7-2b27532054ee.webp	f	34500.00	f	0	7	t	2	2026-06-15 05:42:21.15459	2026-06-15 05:42:21.15459	7
11	NOMAD PASSPORT WALLET	WALLET	Compact and elegant, crafted to keep your travel documents secure while aging beautifully over time.	/uploads/7494d1ee-3b58-46ae-a15a-7c30e7d7f310.webp	f	4800.00	f	0	20	t	2	2026-06-15 05:43:21.686033	2026-06-15 05:43:21.686033	20
12	HERITAGE EXECUTIVE BRIEFCASE	BREIFCASE	Created for leaders and professionals, the Heritage Briefcase combines refined aesthetics with practical organization for everyday success.	/uploads/40f6fe25-3874-400c-a45e-44c5b5ff2057.webp	f	39500.00	f	0	6	t	3	2026-06-15 05:44:23.676598	2026-06-15 05:44:23.676598	6
13	HERITAGE DIPLOMAT CASE	POUCH	The flagship business case, offering generous storage and timeless elegance for executives and entrepreneurs.	/uploads/4b2493d6-6707-4def-baa6-8d015b873cf6.webp	f	45000.00	f	0	4	t	3	2026-06-15 05:48:12.356247	2026-06-15 05:48:12.356247	4
14	HERITAGE PORTFOLIO SLEEVE	SLEEVE	A minimalist leather sleeve designed to protect documents, tablets, and laptops with understated sophistication.	/uploads/72b971b7-857d-4c5f-9fb4-cb2238ae6a0a.webp	f	12500.00	f	0	12	t	3	2026-06-15 05:49:41.157318	2026-06-15 05:49:41.157318	12
15	ARTISAN NO. 1 TOTE	TOTE	Produced in limited numbers and finished by hand, celebrating traditional craftsmanship and contemporary luxury.	/uploads/3b1dd174-b5cb-462f-9e3c-ed95ff5d13a9.webp	f	24500.00	f	0	8	t	4	2026-06-15 05:51:05.68852	2026-06-15 05:51:05.68852	8
16	ARTISAN NO. 2 MESSENGER	MESSENGER	Designed for creatives and professionals who appreciate handcrafted detail and practical elegance.	/uploads/d6bf103c-1e7c-4173-b65a-d15e359db0f4.webp	f	22500.00	f	0	8	t	4	2026-06-15 05:52:27.858726	2026-06-15 05:52:27.858726	8
17	ARTISAN SADDLE BAG	SADDLE-BAG	Inspired by traditional leatherworking techniques, blending heritage design with modern functionality.	/uploads/96eed5fd-eec8-4d6e-86a7-92d6c96f39da.webp	f	18500.00	f	0	10	t	4	2026-06-15 05:53:47.804583	2026-06-15 05:53:47.804583	10
20	SAVANNAH MARKET TOTE	MARKET-TOTE	Spacious and versatile, perfect for work, shopping, and weekend outings.	/uploads/48d73e16-6ff4-4b55-a54d-1d1cb540b7a3.webp	f	17500.00	f	0	8	t	5	2026-06-15 05:58:55.860159	2026-06-15 05:58:55.860159	8
19	SAVANNAH EVERYDAY TOTE	EVERYDAY-TOTE	A versatile tote designed for daily life, balancing elegance, comfort, and practicality.	/uploads/054aabd7-17f9-4c32-84fa-ac38b5c45dd5.webp	f	14500.00	f	0	10	t	5	2026-06-15 05:57:16.857238	2026-06-15 05:57:16.857238	10
21	SERO Heritage Bookmark	BOOKMARK	A symbolic piece from the SERO collection. Crafted digitally as a collectible design representing our commitment to African craftsmanship and timeless leather goods.	/uploads/38e4752a-7467-4b3d-984e-338c0119cb8c.webp	f	1.00	f	0	999	t	3	2026-06-15 06:59:52.869764	2026-06-15 06:59:52.869764	999
23	SERO Bronze Voucher	VOUCHERS	A gifting voucher valued at KSh 750, redeemable across all SERO collections.	/uploads/196b3ebb-64c5-43d0-9da9-1b22d5d61345.webp	f	1.00	f	0	190	t	6	2026-06-15 07:05:23.372594	2026-06-15 07:05:23.372594	200
24	SERO Starter Voucher	STARTER-VOUCHER	A symbolic entry into the SERO world. Perfect for first-time supporters and collectors. Redeemable towards future purchases and exclusive member experiences.	/uploads/1d43d2ac-2e21-48b5-8143-2cb5560ee0be.webp	f	1.00	f	0	989	t	6	2026-06-15 13:17:35.270262	2026-06-15 13:17:35.270262	1000
22	SERO Welcome Voucher	VOUCHER	Unlock your journey into the world of SERO. Redeem this voucher to receive KSh 500 off any purchase above KSh 5,000.	/uploads/123c1e9b-9b4e-4cfa-a0d3-5d2278e5f529.webp	f	1.00	f	0	488	t	6	2026-06-15 07:02:53.888207	2026-06-15 07:02:53.888207	500
\.


--
-- Data for Name: variant; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.variant (id, product_id, size, colour, stock, created_at, updated_at) FROM stdin;
\.


--
-- Name: admin_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admin_id_seq', 2, true);


--
-- Name: category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.category_id_seq', 6, true);


--
-- Name: currency_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.currency_id_seq', 3, true);


--
-- Name: order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.order_id_seq', 33, true);


--
-- Name: order_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.order_item_id_seq', 31, true);


--
-- Name: payment_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payment_log_id_seq', 36, true);


--
-- Name: product_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.product_id_seq', 24, true);


--
-- Name: variant_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.variant_id_seq', 1, false);


--
-- Name: admin admin_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_pkey PRIMARY KEY (id);


--
-- Name: admin admin_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_username_key UNIQUE (username);


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: category category_description_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.category
    ADD CONSTRAINT category_description_key UNIQUE (description);


--
-- Name: category category_image_url_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.category
    ADD CONSTRAINT category_image_url_key UNIQUE (image_url);


--
-- Name: category category_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.category
    ADD CONSTRAINT category_name_key UNIQUE (name);


--
-- Name: category category_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.category
    ADD CONSTRAINT category_pkey PRIMARY KEY (id);


--
-- Name: category category_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.category
    ADD CONSTRAINT category_slug_key UNIQUE (slug);


--
-- Name: currency currency_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.currency
    ADD CONSTRAINT currency_code_key UNIQUE (code);


--
-- Name: currency currency_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.currency
    ADD CONSTRAINT currency_pkey PRIMARY KEY (id);


--
-- Name: order_item order_item_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_item
    ADD CONSTRAINT order_item_pkey PRIMARY KEY (id);


--
-- Name: order order_merchant_reference_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."order"
    ADD CONSTRAINT order_merchant_reference_key UNIQUE (merchant_reference);


--
-- Name: order order_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."order"
    ADD CONSTRAINT order_pkey PRIMARY KEY (id);


--
-- Name: payment_log payment_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_log
    ADD CONSTRAINT payment_log_pkey PRIMARY KEY (id);


--
-- Name: product product_description_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_description_key UNIQUE (description);


--
-- Name: product product_image_url_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_image_url_key UNIQUE (image_url);


--
-- Name: product product_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_name_key UNIQUE (name);


--
-- Name: product product_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_pkey PRIMARY KEY (id);


--
-- Name: product product_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_slug_key UNIQUE (slug);


--
-- Name: variant variant_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.variant
    ADD CONSTRAINT variant_pkey PRIMARY KEY (id);


--
-- Name: ix_admin_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_admin_id ON public.admin USING btree (id);


--
-- Name: ix_category_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_category_id ON public.category USING btree (id);


--
-- Name: ix_currency_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_currency_id ON public.currency USING btree (id);


--
-- Name: ix_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_order_id ON public."order" USING btree (id);


--
-- Name: ix_order_item_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_order_item_id ON public.order_item USING btree (id);


--
-- Name: ix_payment_log_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_payment_log_id ON public.payment_log USING btree (id);


--
-- Name: ix_product_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_product_id ON public.product USING btree (id);


--
-- Name: ix_variant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_variant_id ON public.variant USING btree (id);


--
-- Name: order_item order_item_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_item
    ADD CONSTRAINT order_item_order_id_fkey FOREIGN KEY (order_id) REFERENCES public."order"(id);


--
-- Name: order_item order_item_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_item
    ADD CONSTRAINT order_item_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(id);


--
-- Name: order_item order_item_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_item
    ADD CONSTRAINT order_item_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.variant(id);


--
-- Name: payment_log payment_log_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_log
    ADD CONSTRAINT payment_log_order_id_fkey FOREIGN KEY (order_id) REFERENCES public."order"(id);


--
-- Name: product product_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.category(id);


--
-- Name: variant variant_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.variant
    ADD CONSTRAINT variant_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(id);


--
-- PostgreSQL database dump complete
--

\unrestrict HqehLCRCfwq5DPC7JG8gh6Ozs67Sg32a8acmSE3UdXHrWFcmaIC0gRnrg97Pips

