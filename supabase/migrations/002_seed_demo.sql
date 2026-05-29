-- =============================================================
-- 002_seed_demo.sql
-- Seeds the "Spice Garden" demo restaurant, 10 tables, and 13 menu items.
-- Idempotent: safe to run multiple times — uses upserts.
-- Run in: Supabase Dashboard -> SQL Editor -> New query
-- =============================================================

-- ---------- 1. Demo restaurant ----------
insert into public.restaurants (slug, name, subtitle, rating, prep_time)
values ('spice-garden', 'Spice Garden', 'Authentic Hyderabadi Cuisine', 4.7, '15-20 min')
on conflict (slug) do update
  set name = excluded.name,
      subtitle = excluded.subtitle,
      rating = excluded.rating,
      prep_time = excluded.prep_time;

-- ---------- 2. Ten tables ----------
insert into public.restaurant_tables (restaurant_id, table_number)
select r.id, t.n
from public.restaurants r
cross join generate_series(1, 10) as t(n)
where r.slug = 'spice-garden'
on conflict (restaurant_id, table_number) do nothing;

-- ---------- 3. Menu items ----------
-- Done in a single CTE so the same restaurant_id is reused.
with r as (
  select id from public.restaurants where slug = 'spice-garden'
)
insert into public.menu_items
  (restaurant_id, name, description, category, price, veg, emoji, image_url, tags, in_stock, display_order)
select r.id, v.name, v.description, v.category, v.price, v.veg, v.emoji, v.image_url, v.tags, true, v.display_order
from r,
(values
  (1,  'Hyderabadi Dum Biryani', 'Slow-cooked long grain basmati rice with tender spiced mutton, caramelized onions & fresh raita', 'biryani',  299, false, '🍛', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200&auto=format&fit=crop&q=80', array['best','spicy']::text[]),
  (2,  'Veg Dum Biryani',         'Rich layered rice cooked with seasonal vegetables, aromatic spices, served with thick salan', 'biryani',  199, true,  '🍚', 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=200&auto=format&fit=crop&q=80', array[]::text[]),
  (3,  'Chicken Biryani',         'Tender spiced chicken pieces dum-cooked with long aromatic basmati rice & saffron milk', 'biryani', 249, false, '🥘', 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=200&auto=format&fit=crop&q=80', array['best']::text[]),
  (4,  'Chicken 65',              'Classic local red fried chicken tossed in hot yoghurt sauce, curry leaves, and green chillies', 'starters', 189, false, '🍗', 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=200&auto=format&fit=crop&q=80', array['spicy','best']::text[]),
  (5,  'Paneer Tikka',            'Soft paneer cubes skewered with onions and bell peppers, grilled freshly inside our tandoor pot', 'starters', 159, true,  '🧀', 'https://images.unsplash.com/photo-1567188040759-fb8a883db6d8?w=200&auto=format&fit=crop&q=80', array['chef']::text[]),
  (6,  'Mutton Seekh Kebab',      'Finely minced fresh mutton spiced with herbs, grilled on charcoal skewers, served hot with mint dip', 'starters', 229, false, '🥩', 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=200&auto=format&fit=crop&q=80', array['chef']::text[]),
  (7,  'Butter Naan',             'Soft oven-baked leavened bread brushed generously with pure local cow butter', 'breads', 49, true, '🫓', 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=200&auto=format&fit=crop&q=80', array[]::text[]),
  (8,  'Garlic Roti',             'Traditional whole wheat bread layered with fresh minced garlic and roasted coriander leaves', 'breads', 39, true, '🫓', 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=200&auto=format&fit=crop&q=80', array['best']::text[]),
  (9,  'Irani Chai',              'Hyderabad iconic strong creamy sweet tea brewed slow, paired best with crusty Osmania biscuit', 'drinks', 49, true, '☕', 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=200&auto=format&fit=crop&q=80', array['best']::text[]),
  (10, 'Mango Lassi',             'Thick sweetened yogurt blended with sweet ripe Alphonso mangoes, served chilled in clay glass', 'drinks', 79, true, '🥛', 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=200&auto=format&fit=crop&q=80', array[]::text[]),
  (11, 'Fresh Lime Soda',         'Fresh squeezed sour lemon soda, made to your selection of sweet, salted, or mixed', 'drinks', 59, true, '🍋', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=200&auto=format&fit=crop&q=80', array[]::text[]),
  (12, 'Double Ka Meetha',        'Diner favorite golden fried bread pudding soaked in saffron syrup, thick cardamom rabri & nuts', 'desserts', 99, true, '🍮', 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=200&auto=format&fit=crop&q=80', array['best']::text[]),
  (13, 'Qubani Ka Meetha',        'Traditional stewed dried apricot dessert sweetened, served topped with thick heavy fresh cream', 'desserts', 89, true, '🍑', 'https://images.unsplash.com/photo-1548849186-57bd530ecd3d?w=200&auto=format&fit=crop&q=80', array[]::text[])
) as v(display_order, name, description, category, price, veg, emoji, image_url, tags)
where not exists (
  select 1 from public.menu_items m
  where m.restaurant_id = r.id and m.name = v.name
);
