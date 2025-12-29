// ============================================
// COMPONENTE: EMOJI PICKER
// Selector visual de emojis e iconos en cuadrícula
// ============================================

import { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Search, X,
  // === ICONOS PARA CARPAS Y EVENTOS ===
  Tent, TreePine, Umbrella, Sun, Cloud, CloudRain, Wind, Snowflake,
  // === ESTRUCTURAS Y CONSTRUCCIÓN ===
  Building, Building2, Home, Warehouse, Factory, Store, Landmark,
  Construction, Hammer, Wrench, Drill, Ruler, PenTool,
  Columns, LayoutGrid, Grid3X3, Square, Layers, Frame,
  // === MOBILIARIO ===
  Armchair, Sofa, Lamp, LampDesk, Table, Table2, Bed, DoorOpen, DoorClosed,
  // === ELECTRICIDAD E ILUMINACIÓN ===
  Plug, PlugZap, Zap, Power, PowerOff, Battery, BatteryCharging, BatteryFull, BatteryLow,
  Lightbulb, Flashlight, SunMedium, Moon,
  Cable, Wifi, Radio, Antenna,
  // === AUDIO Y SONIDO ===
  Speaker, Volume2, VolumeX, Mic, Mic2, MicOff, Music, Music2, Music4, Headphones,
  // === TRANSPORTE Y LOGÍSTICA ===
  Truck, Car, Bus, Package, PackageOpen, PackageCheck, Box, Boxes, Container,
  ShoppingCart, Forklift,
  // === HERRAMIENTAS ===
  Wrench as Wrench2, Scissors, Paintbrush, Palette, Brush,
  Shovel, Axe, FlameKindling, Flame,
  // === AGUA Y CLIMA ===
  Droplet, Droplets, Waves, Thermometer, ThermometerSun, ThermometerSnowflake,
  CloudSun, Cloudy, CloudLightning, Sunrise, Sunset,
  // === DECORACIÓN Y FLORES ===
  Flower, Flower2, TreeDeciduous, Trees, Leaf, Shrub, Sprout,
  // === COMIDA Y BEBIDAS ===
  UtensilsCrossed, ChefHat, CookingPot, Refrigerator, Wine, Beer, Coffee,
  GlassWater, IceCreamCone, Cake, Pizza,
  // === CELEBRACIONES ===
  PartyPopper, Gift, Sparkles, Star, Heart, Crown, Trophy, Medal, Award,
  Cake as CakeIcon, Rocket, Fireworks, Confetti,
  // === PERSONAS Y USUARIOS ===
  Users, UserPlus, UserCheck, Baby, PersonStanding,
  // === SEGURIDAD ===
  Shield, ShieldCheck, Lock, Unlock, Key, AlertTriangle, Bell, BellRing, Siren,
  // === TIEMPO Y CALENDARIO ===
  Clock, Timer, Calendar, CalendarDays, CalendarCheck, Hourglass,
  // === DINERO ===
  DollarSign, Wallet, CreditCard, Receipt, PiggyBank, Coins,
  // === DOCUMENTOS ===
  FileText, Files, FolderOpen, Clipboard, ClipboardList, ClipboardCheck,
  // === MAPAS Y UBICACIÓN ===
  MapPin, Map, Navigation, Compass, Globe,
  // === VERIFICACIÓN Y ESTADOS ===
  Check, CheckCircle, XCircle, AlertCircle, Info, HelpCircle,
  CircleDot, Circle, CircleOff,
  // === FLECHAS Y DIRECCIÓN ===
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, MoveVertical, MoveHorizontal, Move,
  // === OTROS ÚTILES ===
  Tag, Tags, Bookmark, Flag, Eye, EyeOff, Search as SearchIcon, Settings, Cog,
  Link, ExternalLink, QrCode, Barcode, Scan, Camera, Video, Image,
  Maximize, Minimize, Expand, Shrink, RotateCw, RefreshCw,
  Plus, Minus, Equal, Hash, Asterisk, AtSign
} from 'lucide-react'

/**
 * ¿QUÉ HACE ESTE COMPONENTE?
 * 
 * EmojiPicker es un selector visual de emojis que permite al usuario
 * elegir un emoji haciendo clic en él en lugar de tener que escribirlo.
 * 
 * CARACTERÍSTICAS:
 * - Muestra emojis organizados por categorías
 * - Buscador para filtrar emojis
 * - Responsive (se adapta a móvil y desktop)
 * - Se puede cerrar haciendo clic fuera
 * - Muestra el emoji seleccionado actualmente
 */

/**
 * EMOJIS ORGANIZADOS POR CATEGORÍA
 *
 * Colección completa de emojis organizados por categorías
 * útiles para un sistema de inventario de carpas y eventos.
 */
const EMOJI_CATEGORIES = {
  // ========== CATEGORÍAS PRINCIPALES PARA INVENTARIO ==========
  'Eventos y Carpas': [
    '🎪', '⛺', '🏕️', '🎡', '🎢', '🎠', '🎭', '🎬',
    '🎤', '🎧', '🎼', '🎹', '🎺', '🎷', '🪘', '🥁',
    '🎸', '🎻', '🎵', '🎶', '🎙️', '📢', '📣', '🔔'
  ],
  'Mobiliario': [
    '🪑', '🛋️', '🛏️', '🛌', '🚪', '🪟', '🖼️', '🪞',
    '🧴', '🪥', '🪒', '🧽', '🧻', '🪤', '🪣', '🧹',
    '🧺', '🪆', '🏺', '⚱️', '🛒', '🪞', '🪟', '🛖'
  ],
  'Iluminación': [
    '💡', '🔦', '🕯️', '🪔', '🏮', '🔆', '🔅', '✨',
    '⚡', '💫', '🌟', '⭐', '🌠', '🌃', '🌆', '🌇'
  ],
  'Herramientas': [
    '🔨', '🪓', '⛏️', '⚒️', '🛠️', '🗡️', '⚔️', '🔧',
    '🔩', '⚙️', '🗜️', '⚖️', '🦯', '🔗', '⛓️', '🪝',
    '🧰', '🧲', '🪜', '🪚', '🪛', '🪤', '📏', '📐',
    '✂️', '🔪', '🗑️', '🪠', '🧯', '🪬', '🔑', '🗝️'
  ],
  'Construcción': [
    '🏗️', '🧱', '🪨', '🪵', '🛖', '🏠', '🏡', '🏘️',
    '🏚️', '🏢', '🏣', '🏤', '🏥', '🏦', '🏨', '🏩',
    '🏪', '🏫', '🏬', '🏭', '🏯', '🏰', '🗼', '🗽',
    '⛪', '🕌', '🛕', '🕍', '⛩️', '🕋', '⛲', '⛺'
  ],
  'Electricidad': [
    '🔌', '🔋', '🪫', '⚡', '💡', '🔦', '📡', '🛰️',
    '💻', '🖥️', '⌨️', '🖱️', '🖨️', '📠', '☎️', '📞'
  ],

  // ========== TRANSPORTE ==========
  'Vehículos Terrestres': [
    '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑',
    '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵',
    '🚲', '🛴', '🛹', '🛼', '🚏', '🛣️', '🛤️', '⛽'
  ],
  'Otros Transportes': [
    '✈️', '🛩️', '🛫', '🛬', '🚀', '🛸', '🚁', '🛶',
    '⛵', '🚤', '🛥️', '🛳️', '⛴️', '🚢', '⚓', '🚂',
    '🚃', '🚄', '🚅', '🚆', '🚇', '🚈', '🚉', '🚊'
  ],

  // ========== OFICINA Y TRABAJO ==========
  'Oficina': [
    '💼', '📁', '📂', '🗂️', '📋', '📊', '📈', '📉',
    '🗃️', '📇', '📌', '📍', '🗄️', '📎', '🖇️', '📐',
    '📏', '🗒️', '🗓️', '📆', '📅', '🗑️', '📰', '🗞️'
  ],
  'Escritura': [
    '✏️', '✒️', '🖊️', '🖋️', '🖍️', '📝', '📃', '📄',
    '📑', '🔖', '🏷️', '📒', '📓', '📔', '📕', '📖',
    '📗', '📘', '📙', '📚', '📜', '📰', '🗞️', '🔏'
  ],
  'Tecnología': [
    '💻', '🖥️', '🖨️', '⌨️', '🖱️', '🖲️', '💽', '💾',
    '💿', '📀', '🧮', '📱', '📲', '☎️', '📞', '📟',
    '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '⏱️', '⏲️'
  ],

  // ========== PAQUETERÍA Y ENVÍOS ==========
  'Paquetes y Envíos': [
    '📦', '📫', '📪', '📬', '📭', '📮', '🗳️', '📤',
    '📥', '📧', '📨', '📩', '📪', '✉️', '💌', '🏷️'
  ],
  'Bolsas y Contenedores': [
    '🎁', '🛍️', '👜', '👝', '🎒', '🧳', '💼', '🛅',
    '🪣', '🧺', '🗑️', '🪤', '📦', '🗃️', '🗄️', '🧰'
  ],

  // ========== COMIDA Y BEBIDA ==========
  'Frutas': [
    '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓',
    '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝'
  ],
  'Verduras': [
    '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑',
    '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🫘'
  ],
  'Comida': [
    '🍞', '🥐', '🥖', '🫓', '🥨', '🥯', '🥞', '🧇',
    '🧀', '🍖', '🍗', '🥩', '🥓', '🍔', '🍟', '🍕',
    '🌭', '🥪', '🌮', '🌯', '🫔', '🥙', '🧆', '🥚',
    '🍳', '🥘', '🍲', '🫕', '🥣', '🥗', '🍿', '🧈'
  ],
  'Postres': [
    '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁',
    '🥧', '🍫', '🍬', '🍭', '🍮', '🍯', '🥜', '🌰'
  ],
  'Bebidas': [
    '🍼', '🥛', '☕', '🫖', '🍵', '🧃', '🥤', '🧋',
    '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹',
    '🧉', '🍾', '🫗', '🏺', '🧊', '🥢', '🍽️', '🍴'
  ],
  'Utensilios Cocina': [
    '🍽️', '🍴', '🥄', '🔪', '🫙', '🏺', '🥡', '🥢',
    '🧂', '🧊', '🫕', '🍳', '🥘', '🫖', '☕', '🍵'
  ],

  // ========== NATURALEZA ==========
  'Flores': [
    '💐', '🌸', '💮', '🏵️', '🌹', '🥀', '🌺', '🌻',
    '🌼', '🌷', '🌱', '🪴', '🌲', '🌳', '🌴', '🌵'
  ],
  'Plantas': [
    '🌿', '☘️', '🍀', '🍁', '🍂', '🍃', '🪹', '🪺',
    '🍄', '🌾', '🪻', '🪷', '🪸', '🌰', '🥜', '🫘'
  ],
  'Clima': [
    '☀️', '🌤️', '⛅', '🌥️', '☁️', '🌦️', '🌧️', '⛈️',
    '🌩️', '🌨️', '❄️', '☃️', '⛄', '🌬️', '💨', '🌪️',
    '🌫️', '🌈', '☔', '💧', '💦', '🌊', '🔥', '✨'
  ],
  'Astronomía': [
    '🌍', '🌎', '🌏', '🌐', '🌑', '🌒', '🌓', '🌔',
    '🌕', '🌖', '🌗', '🌘', '🌙', '🌚', '🌛', '🌜',
    '☀️', '🌝', '🌞', '⭐', '🌟', '🌠', '💫', '✨'
  ],

  // ========== ANIMALES ==========
  'Animales Terrestres': [
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
    '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈',
    '🙉', '🙊', '🐒', '🦍', '🦧', '🐔', '🐧', '🐦'
  ],
  'Animales Marinos': [
    '🐳', '🐋', '🐬', '🦭', '🐟', '🐠', '🐡', '🦈',
    '🐙', '🐚', '🦀', '🦞', '🦐', '🦑', '🦪', '🐊'
  ],
  'Insectos': [
    '🐌', '🦋', '🐛', '🐜', '🐝', '🪲', '🐞', '🦗',
    '🪳', '🕷️', '🕸️', '🦂', '🦟', '🪰', '🪱', '🦠'
  ],
  'Otros Animales': [
    '🦃', '🐓', '🐣', '🐤', '🐥', '🦆', '🦅', '🦉',
    '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🐛',
    '🦋', '🐌', '🐞', '🐜', '🪲', '🪳', '🦟', '🦗'
  ],

  // ========== DEPORTES ==========
  'Deportes Pelota': [
    '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉',
    '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍'
  ],
  'Otros Deportes': [
    '🏏', '🪃', '🥅', '⛳', '🪁', '🛷', '🎿', '⛷️',
    '🏂', '🪂', '🏋️', '🤼', '🤸', '⛹️', '🤺', '🏇',
    '🧗', '🚵', '🚴', '🏆', '🥇', '🥈', '🥉', '🏅'
  ],
  'Juegos': [
    '🎮', '🕹️', '🎲', '🧩', '♟️', '🎯', '🎳', '🎰',
    '🎴', '🀄', '🃏', '🪄', '🎭', '🎨', '🧵', '🧶'
  ],

  // ========== SÍMBOLOS ==========
  'Corazones': [
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
    '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖',
    '💘', '💝', '💟', '♥️', '🫀', '❤️‍🔥', '❤️‍🩹', '♡'
  ],
  'Formas': [
    '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '🟤', '⚫',
    '⚪', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '🟫',
    '⬛', '⬜', '◾', '◽', '▪️', '▫️', '🔶', '🔷',
    '🔸', '🔹', '🔺', '🔻', '💠', '🔘', '🔳', '🔲'
  ],
  'Flechas': [
    '⬆️', '↗️', '➡️', '↘️', '⬇️', '↙️', '⬅️', '↖️',
    '↕️', '↔️', '↩️', '↪️', '⤴️', '⤵️', '🔃', '🔄',
    '🔙', '🔚', '🔛', '🔜', '🔝', '➡️', '⬅️', '⬆️'
  ],
  'Signos': [
    '✅', '☑️', '✔️', '❌', '❎', '➕', '➖', '➗',
    '✖️', '♾️', '💲', '💱', '™️', '©️', '®️', '〰️',
    '➰', '➿', '🔚', '🔙', '🔛', '🔝', '🔜', '⭕',
    '❗', '❓', '❕', '❔', '‼️', '⁉️', '🔅', '🔆'
  ],
  'Números': [
    '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣',
    '8️⃣', '9️⃣', '🔟', '#️⃣', '*️⃣', '🔢', '🔣', '🔤'
  ],
  'Letras': [
    '🅰️', '🆎', '🅱️', '🆑', '🆒', '🆓', '🆔', '🆕',
    '🆖', '🆗', '🆘', '🆙', '🆚', 'ℹ️', '🈁', '🈂️'
  ],

  // ========== CARAS Y EMOCIONES ==========
  'Caras Felices': [
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
    '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
    '😘', '😗', '☺️', '😚', '😙', '🥲', '😋', '😛'
  ],
  'Caras Neutras': [
    '😐', '😑', '😶', '🫥', '😏', '😒', '🙄', '😬',
    '🫠', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷'
  ],
  'Caras Tristes': [
    '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳',
    '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭',
    '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱'
  ],
  'Caras Enojadas': [
    '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️',
    '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖'
  ],
  'Gestos Caras': [
    '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬',
    '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴',
    '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧'
  ],

  // ========== MANOS Y GESTOS ==========
  'Manos': [
    '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏',
    '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆',
    '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛',
    '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️'
  ],
  'Cuerpo': [
    '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃',
    '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅',
    '👄', '🫦', '💋', '👶', '👧', '🧒', '👦', '👩'
  ],

  // ========== ROPA ==========
  'Ropa': [
    '👔', '👕', '👖', '🧣', '🧤', '🧥', '🧦', '👗',
    '👘', '🥻', '🩱', '🩲', '🩳', '👙', '👚', '👛',
    '👜', '👝', '🛍️', '🎒', '🩴', '👞', '👟', '🥾',
    '🥿', '👠', '👡', '🩰', '👢', '👑', '👒', '🎩'
  ],
  'Accesorios': [
    '🎓', '🧢', '🪖', '⛑️', '📿', '💄', '💍', '💎',
    '👓', '🕶️', '🥽', '🌂', '☂️', '🎀', '🧵', '🧶'
  ],

  // ========== TIEMPO Y FECHAS ==========
  'Tiempo': [
    '⌚', '⏰', '⏱️', '⏲️', '🕰️', '🕛', '🕧', '🕐',
    '🕜', '🕑', '🕝', '🕒', '🕞', '🕓', '🕟', '🕔',
    '🕠', '🕕', '🕡', '🕖', '🕢', '🕗', '🕣', '🕘'
  ],
  'Calendario': [
    '📅', '📆', '🗓️', '📇', '🗒️', '🗃️', '🗄️', '📋',
    '📊', '📈', '📉', '🗺️', '🧭', '⏳', '⌛', '📍'
  ],

  // ========== DINERO ==========
  'Dinero': [
    '💰', '💴', '💵', '💶', '💷', '💸', '💳', '🧾',
    '💹', '💱', '💲', '🏧', '🪙', '💎', '⚖️', '🏦'
  ],

  // ========== SALUD ==========
  'Médico': [
    '💉', '🩸', '💊', '🩹', '🩼', '🩺', '🩻', '🏥',
    '🚑', '🧬', '🦠', '🧫', '🧪', '🔬', '🔭', '⚕️'
  ],

  // ========== SEGURIDAD ==========
  'Seguridad': [
    '🔒', '🔓', '🔐', '🔑', '🗝️', '🚨', '🚔', '🚓',
    '🛡️', '⚔️', '🗡️', '🔫', '🪃', '🏹', '⛓️', '🚧'
  ],

  // ========== BANDERAS ==========
  'Banderas': [
    '🏳️', '🏴', '🏁', '🚩', '🎌', '🏳️‍🌈', '🏳️‍⚧️', '🏴‍☠️',
    '🇦🇷', '🇧🇷', '🇨🇱', '🇨🇴', '🇪🇸', '🇲🇽', '🇵🇪', '🇺🇸',
    '🇬🇧', '🇫🇷', '🇩🇪', '🇮🇹', '🇯🇵', '🇨🇳', '🇰🇷', '🇦🇺'
  ],

  // ========== MISCELÁNEOS ==========
  'Celebración': [
    '🎉', '🎊', '🎈', '🎀', '🎁', '🎗️', '🎟️', '🎫',
    '🎖️', '🏆', '🏅', '🥇', '🥈', '🥉', '🎃', '🎄',
    '🎆', '🎇', '🧨', '✨', '🎋', '🎍', '🎎', '🎏'
  ],
  'Religión': [
    '🕯️', '📿', '🧿', '🪬', '☸️', '✡️', '🔯', '🕎',
    '☯️', '✝️', '☦️', '☪️', '☮️', '🕉️', '🛕', '⛪'
  ],
  'Otros': [
    '♻️', '⚜️', '🔱', '📛', '🔰', '⭕', '✅', '☑️',
    '✔️', '❌', '❎', '➰', '➿', '〽️', '✳️', '✴️',
    '❇️', '©️', '®️', '™️', '🔠', '🔡', '🔢', '🔣'
  ]
}

/**
 * ICONOS LUCIDE ORGANIZADOS POR CATEGORÍA
 *
 * Iconos profesionales de Lucide para el negocio de carpas y eventos.
 * Se guardan con prefijo "lucide:" para identificarlos.
 */
const LUCIDE_CATEGORIES = {
  '⛺ Carpas y Exterior': [
    { name: 'Tent', icon: Tent, label: 'Carpa' },
    { name: 'TreePine', icon: TreePine, label: 'Pino' },
    { name: 'Umbrella', icon: Umbrella, label: 'Sombrilla' },
    { name: 'Sun', icon: Sun, label: 'Sol' },
    { name: 'Cloud', icon: Cloud, label: 'Nube' },
    { name: 'CloudRain', icon: CloudRain, label: 'Lluvia' },
    { name: 'Wind', icon: Wind, label: 'Viento' },
    { name: 'Snowflake', icon: Snowflake, label: 'Nieve' },
    { name: 'CloudSun', icon: CloudSun, label: 'Parcial' },
    { name: 'Sunrise', icon: Sunrise, label: 'Amanecer' },
    { name: 'Sunset', icon: Sunset, label: 'Atardecer' },
    { name: 'Thermometer', icon: Thermometer, label: 'Temperatura' },
  ],
  '🏗️ Estructuras': [
    { name: 'Building', icon: Building, label: 'Edificio' },
    { name: 'Building2', icon: Building2, label: 'Edificio 2' },
    { name: 'Home', icon: Home, label: 'Casa' },
    { name: 'Warehouse', icon: Warehouse, label: 'Almacén' },
    { name: 'Factory', icon: Factory, label: 'Fábrica' },
    { name: 'Store', icon: Store, label: 'Tienda' },
    { name: 'Landmark', icon: Landmark, label: 'Monumento' },
    { name: 'Construction', icon: Construction, label: 'Construcción' },
    { name: 'Columns', icon: Columns, label: 'Columnas' },
    { name: 'LayoutGrid', icon: LayoutGrid, label: 'Cuadrícula' },
    { name: 'Grid3X3', icon: Grid3X3, label: 'Grid 3x3' },
    { name: 'Square', icon: Square, label: 'Cuadrado' },
    { name: 'Layers', icon: Layers, label: 'Capas' },
    { name: 'Frame', icon: Frame, label: 'Marco' },
  ],
  '🪑 Mobiliario': [
    { name: 'Armchair', icon: Armchair, label: 'Sillón' },
    { name: 'Sofa', icon: Sofa, label: 'Sofá' },
    { name: 'Table', icon: Table, label: 'Mesa' },
    { name: 'Table2', icon: Table2, label: 'Mesa 2' },
    { name: 'Bed', icon: Bed, label: 'Cama' },
    { name: 'Lamp', icon: Lamp, label: 'Lámpara' },
    { name: 'LampDesk', icon: LampDesk, label: 'Lámpara Escritorio' },
    { name: 'DoorOpen', icon: DoorOpen, label: 'Puerta Abierta' },
    { name: 'DoorClosed', icon: DoorClosed, label: 'Puerta Cerrada' },
  ],
  '⚡ Electricidad': [
    { name: 'Plug', icon: Plug, label: 'Enchufe' },
    { name: 'PlugZap', icon: PlugZap, label: 'Enchufe Activo' },
    { name: 'Zap', icon: Zap, label: 'Rayo' },
    { name: 'Power', icon: Power, label: 'Energía' },
    { name: 'PowerOff', icon: PowerOff, label: 'Apagado' },
    { name: 'Battery', icon: Battery, label: 'Batería' },
    { name: 'BatteryCharging', icon: BatteryCharging, label: 'Cargando' },
    { name: 'BatteryFull', icon: BatteryFull, label: 'Batería Llena' },
    { name: 'BatteryLow', icon: BatteryLow, label: 'Batería Baja' },
    { name: 'Cable', icon: Cable, label: 'Cable' },
    { name: 'Wifi', icon: Wifi, label: 'WiFi' },
    { name: 'Radio', icon: Radio, label: 'Radio' },
    { name: 'Antenna', icon: Antenna, label: 'Antena' },
  ],
  '💡 Iluminación': [
    { name: 'Lightbulb', icon: Lightbulb, label: 'Bombilla' },
    { name: 'Flashlight', icon: Flashlight, label: 'Linterna' },
    { name: 'SunMedium', icon: SunMedium, label: 'Sol Medio' },
    { name: 'Moon', icon: Moon, label: 'Luna' },
    { name: 'Sparkles', icon: Sparkles, label: 'Destellos' },
    { name: 'Star', icon: Star, label: 'Estrella' },
    { name: 'Flame', icon: Flame, label: 'Llama' },
    { name: 'FlameKindling', icon: FlameKindling, label: 'Fuego' },
  ],
  '🔊 Audio y Sonido': [
    { name: 'Speaker', icon: Speaker, label: 'Altavoz' },
    { name: 'Volume2', icon: Volume2, label: 'Volumen' },
    { name: 'VolumeX', icon: VolumeX, label: 'Silencio' },
    { name: 'Mic', icon: Mic, label: 'Micrófono' },
    { name: 'Mic2', icon: Mic2, label: 'Micrófono 2' },
    { name: 'MicOff', icon: MicOff, label: 'Mic Apagado' },
    { name: 'Music', icon: Music, label: 'Música' },
    { name: 'Music2', icon: Music2, label: 'Música 2' },
    { name: 'Music4', icon: Music4, label: 'Música 4' },
    { name: 'Headphones', icon: Headphones, label: 'Audífonos' },
    { name: 'Bell', icon: Bell, label: 'Campana' },
    { name: 'BellRing', icon: BellRing, label: 'Campana Sonando' },
  ],
  '🚚 Transporte y Logística': [
    { name: 'Truck', icon: Truck, label: 'Camión' },
    { name: 'Car', icon: Car, label: 'Auto' },
    { name: 'Bus', icon: Bus, label: 'Bus' },
    { name: 'Package', icon: Package, label: 'Paquete' },
    { name: 'PackageOpen', icon: PackageOpen, label: 'Paquete Abierto' },
    { name: 'PackageCheck', icon: PackageCheck, label: 'Paquete OK' },
    { name: 'Box', icon: Box, label: 'Caja' },
    { name: 'Boxes', icon: Boxes, label: 'Cajas' },
    { name: 'Container', icon: Container, label: 'Contenedor' },
    { name: 'ShoppingCart', icon: ShoppingCart, label: 'Carrito' },
    { name: 'Forklift', icon: Forklift, label: 'Montacargas' },
  ],
  '🔧 Herramientas': [
    { name: 'Hammer', icon: Hammer, label: 'Martillo' },
    { name: 'Wrench', icon: Wrench, label: 'Llave' },
    { name: 'Drill', icon: Drill, label: 'Taladro' },
    { name: 'Ruler', icon: Ruler, label: 'Regla' },
    { name: 'Scissors', icon: Scissors, label: 'Tijeras' },
    { name: 'Paintbrush', icon: Paintbrush, label: 'Brocha' },
    { name: 'Palette', icon: Palette, label: 'Paleta' },
    { name: 'Brush', icon: Brush, label: 'Cepillo' },
    { name: 'Shovel', icon: Shovel, label: 'Pala' },
    { name: 'Axe', icon: Axe, label: 'Hacha' },
    { name: 'PenTool', icon: PenTool, label: 'Pluma' },
    { name: 'Settings', icon: Settings, label: 'Configuración' },
    { name: 'Cog', icon: Cog, label: 'Engranaje' },
  ],
  '💧 Agua y Clima': [
    { name: 'Droplet', icon: Droplet, label: 'Gota' },
    { name: 'Droplets', icon: Droplets, label: 'Gotas' },
    { name: 'Waves', icon: Waves, label: 'Olas' },
    { name: 'ThermometerSun', icon: ThermometerSun, label: 'Calor' },
    { name: 'ThermometerSnowflake', icon: ThermometerSnowflake, label: 'Frío' },
    { name: 'CloudLightning', icon: CloudLightning, label: 'Tormenta' },
    { name: 'Cloudy', icon: Cloudy, label: 'Nublado' },
  ],
  '🌸 Decoración': [
    { name: 'Flower', icon: Flower, label: 'Flor' },
    { name: 'Flower2', icon: Flower2, label: 'Flor 2' },
    { name: 'TreeDeciduous', icon: TreeDeciduous, label: 'Árbol' },
    { name: 'Trees', icon: Trees, label: 'Árboles' },
    { name: 'Leaf', icon: Leaf, label: 'Hoja' },
    { name: 'Shrub', icon: Shrub, label: 'Arbusto' },
    { name: 'Sprout', icon: Sprout, label: 'Brote' },
    { name: 'Heart', icon: Heart, label: 'Corazón' },
  ],
  '🍽️ Catering': [
    { name: 'UtensilsCrossed', icon: UtensilsCrossed, label: 'Cubiertos' },
    { name: 'ChefHat', icon: ChefHat, label: 'Chef' },
    { name: 'CookingPot', icon: CookingPot, label: 'Olla' },
    { name: 'Refrigerator', icon: Refrigerator, label: 'Refrigerador' },
    { name: 'Wine', icon: Wine, label: 'Vino' },
    { name: 'Beer', icon: Beer, label: 'Cerveza' },
    { name: 'Coffee', icon: Coffee, label: 'Café' },
    { name: 'GlassWater', icon: GlassWater, label: 'Agua' },
    { name: 'IceCreamCone', icon: IceCreamCone, label: 'Helado' },
    { name: 'Cake', icon: Cake, label: 'Pastel' },
    { name: 'Pizza', icon: Pizza, label: 'Pizza' },
  ],
  '🎉 Celebraciones': [
    { name: 'PartyPopper', icon: PartyPopper, label: 'Fiesta' },
    { name: 'Gift', icon: Gift, label: 'Regalo' },
    { name: 'Crown', icon: Crown, label: 'Corona' },
    { name: 'Trophy', icon: Trophy, label: 'Trofeo' },
    { name: 'Medal', icon: Medal, label: 'Medalla' },
    { name: 'Award', icon: Award, label: 'Premio' },
    { name: 'Rocket', icon: Rocket, label: 'Cohete' },
    { name: 'Camera', icon: Camera, label: 'Cámara' },
    { name: 'Video', icon: Video, label: 'Video' },
    { name: 'Image', icon: Image, label: 'Imagen' },
  ],
  '👥 Personas': [
    { name: 'Users', icon: Users, label: 'Usuarios' },
    { name: 'UserPlus', icon: UserPlus, label: 'Agregar Usuario' },
    { name: 'UserCheck', icon: UserCheck, label: 'Usuario OK' },
    { name: 'Baby', icon: Baby, label: 'Bebé' },
    { name: 'PersonStanding', icon: PersonStanding, label: 'Persona' },
  ],
  '🛡️ Seguridad': [
    { name: 'Shield', icon: Shield, label: 'Escudo' },
    { name: 'ShieldCheck', icon: ShieldCheck, label: 'Escudo OK' },
    { name: 'Lock', icon: Lock, label: 'Candado' },
    { name: 'Unlock', icon: Unlock, label: 'Desbloqueado' },
    { name: 'Key', icon: Key, label: 'Llave' },
    { name: 'AlertTriangle', icon: AlertTriangle, label: 'Alerta' },
    { name: 'Siren', icon: Siren, label: 'Sirena' },
  ],
  '📅 Tiempo': [
    { name: 'Clock', icon: Clock, label: 'Reloj' },
    { name: 'Timer', icon: Timer, label: 'Temporizador' },
    { name: 'Calendar', icon: Calendar, label: 'Calendario' },
    { name: 'CalendarDays', icon: CalendarDays, label: 'Días' },
    { name: 'CalendarCheck', icon: CalendarCheck, label: 'Agenda OK' },
    { name: 'Hourglass', icon: Hourglass, label: 'Reloj Arena' },
  ],
  '💰 Finanzas': [
    { name: 'DollarSign', icon: DollarSign, label: 'Dólar' },
    { name: 'Wallet', icon: Wallet, label: 'Billetera' },
    { name: 'CreditCard', icon: CreditCard, label: 'Tarjeta' },
    { name: 'Receipt', icon: Receipt, label: 'Recibo' },
    { name: 'PiggyBank', icon: PiggyBank, label: 'Alcancía' },
    { name: 'Coins', icon: Coins, label: 'Monedas' },
  ],
  '📄 Documentos': [
    { name: 'FileText', icon: FileText, label: 'Documento' },
    { name: 'Files', icon: Files, label: 'Archivos' },
    { name: 'FolderOpen', icon: FolderOpen, label: 'Carpeta' },
    { name: 'Clipboard', icon: Clipboard, label: 'Portapapeles' },
    { name: 'ClipboardList', icon: ClipboardList, label: 'Lista' },
    { name: 'ClipboardCheck', icon: ClipboardCheck, label: 'Check List' },
    { name: 'Tag', icon: Tag, label: 'Etiqueta' },
    { name: 'Tags', icon: Tags, label: 'Etiquetas' },
    { name: 'Bookmark', icon: Bookmark, label: 'Marcador' },
    { name: 'QrCode', icon: QrCode, label: 'QR' },
    { name: 'Barcode', icon: Barcode, label: 'Código Barras' },
    { name: 'Scan', icon: Scan, label: 'Escanear' },
  ],
  '📍 Ubicación': [
    { name: 'MapPin', icon: MapPin, label: 'Pin' },
    { name: 'Map', icon: Map, label: 'Mapa' },
    { name: 'Navigation', icon: Navigation, label: 'Navegación' },
    { name: 'Compass', icon: Compass, label: 'Brújula' },
    { name: 'Globe', icon: Globe, label: 'Globo' },
    { name: 'Flag', icon: Flag, label: 'Bandera' },
  ],
  '✅ Estados': [
    { name: 'Check', icon: Check, label: 'Check' },
    { name: 'CheckCircle', icon: CheckCircle, label: 'Check Círculo' },
    { name: 'XCircle', icon: XCircle, label: 'X Círculo' },
    { name: 'AlertCircle', icon: AlertCircle, label: 'Alerta Círculo' },
    { name: 'Info', icon: Info, label: 'Info' },
    { name: 'HelpCircle', icon: HelpCircle, label: 'Ayuda' },
    { name: 'CircleDot', icon: CircleDot, label: 'Punto' },
    { name: 'Circle', icon: Circle, label: 'Círculo' },
    { name: 'Eye', icon: Eye, label: 'Ojo' },
    { name: 'EyeOff', icon: EyeOff, label: 'Oculto' },
  ],
  '➡️ Flechas': [
    { name: 'ArrowUp', icon: ArrowUp, label: 'Arriba' },
    { name: 'ArrowDown', icon: ArrowDown, label: 'Abajo' },
    { name: 'ArrowLeft', icon: ArrowLeft, label: 'Izquierda' },
    { name: 'ArrowRight', icon: ArrowRight, label: 'Derecha' },
    { name: 'MoveVertical', icon: MoveVertical, label: 'Vertical' },
    { name: 'MoveHorizontal', icon: MoveHorizontal, label: 'Horizontal' },
    { name: 'Move', icon: Move, label: 'Mover' },
    { name: 'RotateCw', icon: RotateCw, label: 'Rotar' },
    { name: 'RefreshCw', icon: RefreshCw, label: 'Refrescar' },
    { name: 'Maximize', icon: Maximize, label: 'Maximizar' },
    { name: 'Minimize', icon: Minimize, label: 'Minimizar' },
    { name: 'Expand', icon: Expand, label: 'Expandir' },
    { name: 'Shrink', icon: Shrink, label: 'Contraer' },
  ],
  '🔢 Símbolos': [
    { name: 'Plus', icon: Plus, label: 'Más' },
    { name: 'Minus', icon: Minus, label: 'Menos' },
    { name: 'Equal', icon: Equal, label: 'Igual' },
    { name: 'Hash', icon: Hash, label: 'Hash' },
    { name: 'Asterisk', icon: Asterisk, label: 'Asterisco' },
    { name: 'AtSign', icon: AtSign, label: 'Arroba' },
    { name: 'Link', icon: Link, label: 'Enlace' },
    { name: 'ExternalLink', icon: ExternalLink, label: 'Externo' },
  ],
}

/**
 * COMPONENTE PRINCIPAL: EmojiPicker
 * 
 * @param {string} selectedEmoji - Emoji actualmente seleccionado
 * @param {function} onSelect - Función que se ejecuta al seleccionar un emoji
 * @param {function} onClose - Función para cerrar el picker
 * 
 * @example
 * <EmojiPicker 
 *   selectedEmoji="📦"
 *   onSelect={(emoji) => setValue('icono', emoji)}
 *   onClose={() => setShowPicker(false)}
 * />
 */
const EmojiPicker = ({ selectedEmoji, onSelect, onClose }) => {

  // Log de debug
  console.log('🎨 EmojiPicker montado')
  console.log('📦 Props:', { selectedEmoji, hasOnSelect: !!onSelect, hasOnClose: !!onClose })

  // ============================================
  // ESTADO
  // ============================================
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('emojis') // 'emojis' | 'iconos'

  // ============================================
  // FUNCIÓN: Filtrar emojis por búsqueda
  // ============================================
  const filteredEmojiCategories = searchTerm
    ? Object.entries(EMOJI_CATEGORIES).reduce((acc, [category, emojis]) => {
        if (category.toLowerCase().includes(searchTerm.toLowerCase())) {
          acc[category] = emojis
        }
        return acc
      }, {})
    : EMOJI_CATEGORIES

  // ============================================
  // FUNCIÓN: Filtrar iconos Lucide por búsqueda
  // ============================================
  const filteredLucideCategories = searchTerm
    ? Object.entries(LUCIDE_CATEGORIES).reduce((acc, [category, icons]) => {
        // Buscar en nombre de categoría o en labels de iconos
        const matchingIcons = icons.filter(icon =>
          icon.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          icon.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        if (category.toLowerCase().includes(searchTerm.toLowerCase())) {
          acc[category] = icons
        } else if (matchingIcons.length > 0) {
          acc[category] = matchingIcons
        }
        return acc
      }, {})
    : LUCIDE_CATEGORIES

  // ============================================
  // HANDLER: Seleccionar emoji
  // ============================================
  const handleSelectEmoji = (emoji) => {
    console.log('✨ Emoji seleccionado:', emoji)
    onSelect(emoji)
    onClose()
  }

  // ============================================
  // HANDLER: Seleccionar icono Lucide
  // ============================================
  const handleSelectLucideIcon = (iconName) => {
    const value = `lucide:${iconName}`
    console.log('✨ Icono Lucide seleccionado:', value)
    onSelect(value)
    onClose()
  }
  
  // ============================================
  // RENDER: UI del componente
  // IMPORTANTE: Usamos Portal para renderizar fuera del Modal
  // ============================================
  const pickerContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* 
        OVERLAY (fondo oscuro)
        - Cubre toda la pantalla
        - Al hacer clic, cierra el picker
        - z-index muy alto para estar sobre el Modal
      */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => {
          console.log('🖱️ Clic en overlay del EmojiPicker')
          onClose()
        }}
      />
      
      {/* 
        CONTENEDOR DEL PICKER
        - Se muestra sobre el overlay
        - Tiene scroll interno si hay muchos emojis
      */}
      <div className="relative bg-white rounded-xl shadow-2xl w-[90vw] max-w-md max-h-[80vh] flex flex-col">
        
        {/* ============================================
            HEADER: Título y botón de cerrar
            ============================================ */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">
            Selecciona un emoji
          </h3>
          
          {/* Botón de cerrar (X) */}
          <button
            onClick={() => {
              console.log('🖱️ Clic en botón X del EmojiPicker')
              onClose()
            }}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        {/* ============================================
            TABS: Emojis / Iconos
            ============================================ */}
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('emojis')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors
              ${activeTab === 'emojis'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
          >
            😀 Emojis
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('iconos')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors
              ${activeTab === 'iconos'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
          >
            <Tent className="w-4 h-4 inline mr-1" /> Iconos
          </button>
        </div>

        {/* ============================================
            BARRA DE BÚSQUEDA
            ============================================ */}
        <div className="px-4 py-3 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={activeTab === 'emojis' ? "Buscar categoría..." : "Buscar icono..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1
                         hover:bg-slate-100 rounded transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>
        </div>
        
        {/* ============================================
            CONTENEDOR DE EMOJIS/ICONOS (con scroll)
            ============================================ */}
        <div className="flex-1 overflow-y-auto px-4 py-4">

          {/* ========== TAB: EMOJIS ========== */}
          {activeTab === 'emojis' && (
            <>
              {Object.entries(filteredEmojiCategories).map(([category, emojis]) => (
                <div key={category} className="mb-6 last:mb-0">
                  <h4 className="text-sm font-medium text-slate-600 mb-2">
                    {category}
                  </h4>
                  <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2">
                    {emojis.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleSelectEmoji(emoji)}
                        className={`
                          w-10 h-10 flex items-center justify-center
                          text-2xl rounded-lg transition-all
                          hover:bg-blue-50 hover:scale-110
                          ${selectedEmoji === emoji
                            ? 'bg-blue-100 ring-2 ring-blue-500'
                            : 'bg-slate-50 hover:bg-blue-50'
                          }
                        `}
                        title={emoji}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {Object.keys(filteredEmojiCategories).length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <p className="text-lg mb-1">😕</p>
                  <p className="text-sm">No se encontraron categorías</p>
                  <p className="text-xs mt-1">Intenta con otro término de búsqueda</p>
                </div>
              )}
            </>
          )}

          {/* ========== TAB: ICONOS LUCIDE ========== */}
          {activeTab === 'iconos' && (
            <>
              {Object.entries(filteredLucideCategories).map(([category, icons]) => (
                <div key={category} className="mb-6 last:mb-0">
                  <h4 className="text-sm font-medium text-slate-600 mb-2">
                    {category}
                  </h4>
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                    {icons.map((iconData) => {
                      const IconComponent = iconData.icon
                      const isSelected = selectedEmoji === `lucide:${iconData.name}`
                      return (
                        <button
                          key={iconData.name}
                          type="button"
                          onClick={() => handleSelectLucideIcon(iconData.name)}
                          className={`
                            w-12 h-12 flex flex-col items-center justify-center
                            rounded-lg transition-all gap-0.5
                            hover:bg-blue-50 hover:scale-105
                            ${isSelected
                              ? 'bg-blue-100 ring-2 ring-blue-500'
                              : 'bg-slate-50 hover:bg-blue-50'
                            }
                          `}
                          title={iconData.label}
                        >
                          <IconComponent className="w-5 h-5 text-slate-700" />
                          <span className="text-[9px] text-slate-500 truncate w-full text-center px-0.5">
                            {iconData.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
              {Object.keys(filteredLucideCategories).length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <SearchIcon className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  <p className="text-sm">No se encontraron iconos</p>
                  <p className="text-xs mt-1">Intenta con otro término de búsqueda</p>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* ============================================
            FOOTER: Botón de cancelar
            ============================================ */}
        <div className="px-4 py-3 border-t border-slate-200">
          <button
            type="button"
            onClick={() => {
              console.log('🖱️ Clic en botón Cancelar del EmojiPicker')
              onClose()
            }}
            className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 
                     text-slate-700 rounded-lg transition-colors font-medium"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
  
  // ============================================
  // USAR PORTAL PARA RENDERIZAR FUERA DEL MODAL
  // ============================================
  /**
   * createPortal renderiza el componente en document.body
   * en lugar de en su posición normal del árbol DOM.
   * 
   * Esto es CRUCIAL porque:
   * - El EmojiPicker está dentro de un Modal
   * - El Modal tiene su propio z-index
   * - Si el EmojiPicker es hijo del Modal, queda limitado por su contexto
   * - Con Portal, el EmojiPicker se renderiza como hermano del Modal
   * - Así su z-index funciona correctamente
   */
  return createPortal(pickerContent, document.body)
}

/**
 * ============================================
 * NOTAS DE USO:
 * ============================================
 * 
 * 1. INSTALACIÓN:
 *    No necesita instalación adicional, solo lucide-react que ya tienes
 * 
 * 2. PERSONALIZACIÓN:
 *    - Puedes agregar/quitar emojis en EMOJI_CATEGORIES
 *    - Puedes cambiar las categorías según tus necesidades
 *    - Puedes ajustar los colores en las clases de Tailwind
 * 
 * 3. RESPONSIVE:
 *    - El picker se adapta automáticamente al tamaño de pantalla
 *    - En móvil muestra 5 columnas
 *    - En tablet muestra 6 columnas
 *    - En desktop muestra 8 columnas
 * 
 * 4. ACCESIBILIDAD:
 *    - Cada emoji es un botón clickeable
 *    - Se puede cerrar con el botón X o haciendo clic fuera
 *    - Tiene focus states para navegación por teclado
 */

// ============================================
// MAPA DE ICONOS LUCIDE PARA RENDERIZADO
// ============================================
const LUCIDE_ICON_MAP = {
  Tent, TreePine, Umbrella, Sun, Cloud, CloudRain, Wind, Snowflake,
  Building, Building2, Home, Warehouse, Factory, Store, Landmark,
  Construction, Hammer, Wrench, Drill, Ruler, PenTool,
  Columns, LayoutGrid, Grid3X3, Square, Layers, Frame,
  Armchair, Sofa, Lamp, LampDesk, Table, Table2, Bed, DoorOpen, DoorClosed,
  Plug, PlugZap, Zap, Power, PowerOff, Battery, BatteryCharging, BatteryFull, BatteryLow,
  Lightbulb, Flashlight, SunMedium, Moon, Cable, Wifi, Radio, Antenna,
  Speaker, Volume2, VolumeX, Mic, Mic2, MicOff, Music, Music2, Music4, Headphones,
  Truck, Car, Bus, Package, PackageOpen, PackageCheck, Box, Boxes, Container,
  ShoppingCart, Forklift,
  Scissors, Paintbrush, Palette, Brush, Shovel, Axe, FlameKindling, Flame,
  Droplet, Droplets, Waves, Thermometer, ThermometerSun, ThermometerSnowflake,
  CloudSun, Cloudy, CloudLightning, Sunrise, Sunset,
  Flower, Flower2, TreeDeciduous, Trees, Leaf, Shrub, Sprout,
  UtensilsCrossed, ChefHat, CookingPot, Refrigerator, Wine, Beer, Coffee,
  GlassWater, IceCreamCone, Cake, Pizza,
  PartyPopper, Gift, Sparkles, Star, Heart, Crown, Trophy, Medal, Award,
  Rocket, Camera, Video, Image,
  Users, UserPlus, UserCheck, Baby, PersonStanding,
  Shield, ShieldCheck, Lock, Unlock, Key, AlertTriangle, Bell, BellRing, Siren,
  Clock, Timer, Calendar, CalendarDays, CalendarCheck, Hourglass,
  DollarSign, Wallet, CreditCard, Receipt, PiggyBank, Coins,
  FileText, Files, FolderOpen, Clipboard, ClipboardList, ClipboardCheck,
  MapPin, Map, Navigation, Compass, Globe,
  Check, CheckCircle, XCircle, AlertCircle, Info, HelpCircle,
  CircleDot, Circle, CircleOff,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, MoveVertical, MoveHorizontal, Move,
  Tag, Tags, Bookmark, Flag, Eye, EyeOff, Settings, Cog,
  Link, ExternalLink, QrCode, Barcode, Scan,
  Maximize, Minimize, Expand, Shrink, RotateCw, RefreshCw,
  Plus, Minus, Equal, Hash, Asterisk, AtSign,
  // Aliases
  Fireworks: Sparkles,
  Confetti: PartyPopper,
  CakeIcon: Cake,
  Wrench2: Wrench,
  SearchIcon: Search,
}

// ============================================
// COMPONENTE HELPER: IconoCategoria
// Renderiza emoji o icono Lucide según el valor
// ============================================
/**
 * Componente que renderiza un emoji o un icono Lucide
 *
 * @param {string} value - El valor del icono (emoji o "lucide:NombreIcono")
 * @param {string} className - Clases CSS adicionales
 * @param {number} size - Tamaño del icono (solo para Lucide)
 *
 * @example
 * // Emoji
 * <IconoCategoria value="🎪" className="text-4xl" />
 *
 * // Icono Lucide
 * <IconoCategoria value="lucide:Tent" size={32} className="text-blue-500" />
 */
export const IconoCategoria = ({ value, className = '', size = 24 }) => {
  // Si no hay valor, mostrar icono por defecto
  if (!value) {
    return <span className={className}>📦</span>
  }

  // Verificar si es un icono Lucide
  if (value.startsWith('lucide:')) {
    const iconName = value.replace('lucide:', '')
    const IconComponent = LUCIDE_ICON_MAP[iconName]

    if (IconComponent) {
      return <IconComponent className={className} size={size} />
    }
    // Si no se encuentra el icono, mostrar emoji por defecto
    return <span className={className}>📦</span>
  }

  // Es un emoji normal
  return <span className={className}>{value}</span>
}

// ============================================
// EXPORTACIÓN POR DEFECTO
// ============================================
export default EmojiPicker