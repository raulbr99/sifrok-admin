# Sistema de diseño — Sifrok Admin

**Dirección:** industrial **negro + volt** (marca Sifrok) con **contenido claro** para
legibilidad de datos. Acento volt como color de **fondo** (nunca texto sobre claro),
esquinas industriales (radio pequeño), una sola familia sans (Geist).

## Tokens (`src/app/globals.css`)

Referencia los tokens, **no** utilidades crudas (`bg-purple-600`, `text-gray-500`…).
Cada token es una utilidad de Tailwind (`bg-surface`, `text-ink`, `border-border`, …).

| Rol | Token / utilidad | Valor | Uso |
|---|---|---|---|
| Fondo página | `bg`/`bg-bg` | `#f5f5f4` | fondo de `<main>` |
| Superficie | `surface`/`bg-surface` | `#ffffff` | cards, paneles, inputs |
| Superficie 2 | `surface-2` | `#f4f4f5` | insets, cabeceras de tabla, hovers |
| Texto | `ink`/`text-ink` | `#0a0a0a` | texto principal, títulos |
| Texto secundario | `ink-muted` | `#52525b` | subtítulos, labels (AA) |
| Texto sutil | `ink-subtle` | `#71717a` | captions, placeholders (AA) |
| Borde | `border`/`border-border` | `#e4e4e7` | bordes de card/tabla |
| Borde fuerte | `border-strong` | `#d4d4d8` | inputs, divisores marcados |
| **Acento (volt)** | `accent`/`bg-accent` | `#d1ff26` | CTAs, estado activo, indicadores |
| Texto sobre acento | `accent-ink` | `#0a0a0a` | **texto/icono sobre volt** |
| Panel oscuro | `panel`/`bg-panel` | `#0a0a0a` | sidebar / chrome oscuro |
| — sobre panel | `on-panel` / `on-panel-muted` | `#fafafa` / `#a1a1aa` | texto en el sidebar |
| Estados | `success`/`-bg`, `danger`/`-bg`, `warning`/`-bg`, `info`/`-bg` | — | badges, alerts |
| Radio | `rounded-card`, `rounded-btn` | `6px` | cards / botones (industrial) |

**Regla del volt:** es un acento de **fondo** (`bg-accent` + `text-accent-ink`). En claro
NO se usa como texto de color (contraste insuficiente); para "activo" en texto sobre
oscuro sí (`text-accent` en el sidebar). Foco de teclado: `outline` ink en claro, accent en oscuro.

## Componentes (`src/components/ui/`)

| Componente | Para | Notas |
|---|---|---|
| `Button` | acciones | `variant`: primary (volt), secondary, ghost, danger · `size` sm/md · `loading`, `disabled` |
| `Card` | contenedores | `bg-surface border-border rounded-card` (sin sombras pesadas) |
| `Badge` | estados | `tone`: neutral/success/danger/warning/info/accent — siempre con etiqueta de texto |
| `Field` + `inputClass` | formularios | label asociado (`htmlFor/id`) + control con estilo consistente |
| `PageHeader` | cabecera de página | título + subtítulo + acciones |
| `Modal` | diálogos | accesible (role/focus-trap/Esc/portal) |
| `Toast` (`useToast`) | avisos | inline `aria-live`, sustituye `alert()` |
| `ConfirmDialog` (`useConfirm`) | confirmaciones | promesa, botones con verbo, tono danger |

## Anti-patrones a evitar (marca)
- **Sin gradient-text** (`bg-clip-text`): títulos en `text-ink` sólido.
- **Sin gradientes morado/rosa**: CTAs en volt (`<Button>`), no `from-purple-600 to-pink-600`.
- **Sin esquinas muy redondeadas** (`rounded-2xl/3xl/full` en cards): usar `rounded-card`.
- **Sin sombras + borde a la vez**: borde 1px `border-border`, sombra solo en overlays.
- Densidad legible: contenido claro; el negro vive en el sidebar y los CTAs en volt.

## Migración
Reemplaza por rol: `bg-white → bg-surface`, `text-gray-900 → text-ink`,
`text-gray-600/500 → text-ink-muted`, `border-gray-200 → border-border`,
`bg-purple-600`/gradientes → `<Button>` o `bg-accent text-accent-ink`,
pills de estado → `<Badge>`, inputs → `inputClass`/`Field`. Mantén la accesibilidad ya añadida.
