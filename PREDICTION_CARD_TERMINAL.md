# Prediction Card - Terminal Style + Responsive Grid ✅

## 🎯 Complete Redesign

### **Terminal-Styled Cards with Multi-Grid Layout**

---

## 📱 Responsive Layout System

### **Desktop (≥ 1024px)**: Multi-Grid View
```
┌─────────────────────┬─────────────────────┐
│ PREDICTION_DATA     │ ACTION_PANEL        │
│ ├─ Asset Header     │ ├─ Market Sentiment │
│ ├─ Question         │ ├─ YES/SKIP/NO      │
│ ├─ Raw Data         │ └─ Instructions     │
│ ├─ Betting Timer    │                     │
│ └─ Balance          │                     │
└─────────────────────┴─────────────────────┘
```

### **Mobile/Tablet (< 1024px)**: Single Card View
```
┌─────────────────────┐
│ PREDICTION_DATA     │
│ ├─ Asset Header     │
│ ├─ Question         │
│ ├─ Raw Data         │
│ ├─ Betting Timer    │
│ └─ Balance          │
└─────────────────────┘
┌─────────────────────┐
│ ACTION_PANEL        │
│ ├─ Market Sentiment │
│ ├─ YES/SKIP/NO      │
│ └─ Instructions     │
└─────────────────────┘
```

**Implementation**:
```tsx
<div className="lg:grid lg:grid-cols-2 lg:gap-4">
  {/* Prediction Data Card */}
  <div className="mb-4 lg:mb-0">...</div>
  
  {/* Action Panel Card */}
  <div>...</div>
</div>
```

---

## 🎨 Card 1: PREDICTION_DATA

### **Terminal Title Bar**:
```tsx
<div className="bg-gradient-to-r from-void-graphite to-void-graphite/80 border-b border-grail/30">
  <div className="flex items-center gap-2">
    <div className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse shadow-lg shadow-neon/50"></div>
    <span className="text-xs font-mono">PREDICTION_DATA</span>
  </div>
  <div className="text-xs font-mono text-gray-500">ID: {prediction.id}</div>
</div>
```

**Features**:
- ✅ Blue blinking dot
- ✅ "PREDICTION_DATA" label
- ✅ Prediction ID display
- ✅ Gradient background

---

### **Asset Header**:
```tsx
<div className="p-4 border-b border-grail/20">
  <div className="flex items-center justify-between">
    {/* Icon + Name */}
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-grail/20 to-grail/5 border border-grail/30">
        {prediction.asset_type === "crypto" ? "₿" : "📈"}
      </div>
      <div>
        <h3 className="text-xl font-black font-mono">{prediction.asset}</h3>
        <p className="text-xs text-gray-500 uppercase font-mono">{prediction.asset_type}</p>
      </div>
    </div>
    
    {/* Timer */}
    <div className="text-right">
      <div className="text-xs text-gray-500 font-mono">RESOLVES_IN</div>
      <div className="text-lg font-bold text-neon font-mono tabular-nums">{timeLeft}</div>
    </div>
  </div>
</div>
```

**Features**:
- ✅ Asset icon with gradient border
- ✅ Asset name in monospace
- ✅ Asset type label
- ✅ Resolution timer (neon color)
- ✅ Tabular numbers

---

### **Question Section**:
```tsx
<div className="p-4 border-b border-grail/20">
  <div className="flex items-center gap-2 mb-2">
    <div className="w-1 h-1 rounded-full bg-grail"></div>
    <span className="text-xs font-mono text-gray-500 uppercase">Question</span>
  </div>
  <p className="text-base text-gray-200 leading-relaxed font-mono">
    {prediction.prediction_text}
  </p>
</div>
```

**Features**:
- ✅ Purple dot indicator
- ✅ "Question" label
- ✅ Monospace text
- ✅ Readable spacing

---

### **Raw Data Section** (NEW):
```tsx
{prediction.raw_text && (
  <div className="p-4 border-b border-grail/20 bg-void-graphite/30">
    <div className="flex items-center gap-2 mb-2">
      <div className="w-1 h-1 rounded-full bg-auric"></div>
      <span className="text-xs font-mono text-gray-500 uppercase">Raw_Data</span>
    </div>
    <p className="text-sm text-gray-400 leading-relaxed font-mono">
      {prediction.raw_text}
    </p>
  </div>
)}
```

**Features**:
- ✅ Gold dot indicator
- ✅ "Raw_Data" label
- ✅ Darker background (void-graphite/30)
- ✅ Smaller text (text-sm)
- ✅ Only shows if raw_text exists

---

### **Betting Timer**:
```tsx
{prediction.betting_close && (
  <div className="p-4 border-b border-grail/20">
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono font-bold ${
      bettingClosed 
        ? 'bg-loss/20 text-loss border border-loss/30' 
        : 'bg-neon/20 text-neon border border-neon/30'
    }`}>
      <div className={`w-1.5 h-1.5 rounded-full ${
        bettingClosed ? 'bg-loss' : 'bg-neon animate-pulse'
      }`}></div>
      <span>
        {bettingClosed ? "BETTING_CLOSED" : `CLOSES_IN: ${timeToBettingClose}`}
      </span>
    </div>
  </div>
)}
```

**Features**:
- ✅ Dynamic color (red when closed, blue when open)
- ✅ Blinking dot (only when open)
- ✅ Terminal-style labels
- ✅ Border styling

---

### **Balance Footer**:
```tsx
<div className="p-4 bg-void-graphite/50">
  <div className="flex items-center justify-between">
    <span className="text-xs font-mono text-gray-500 uppercase">Your_Balance</span>
    <div className="flex items-center gap-2">
      <span className="text-auric font-bold text-lg font-mono tabular-nums">
        {user.real_credits_balance}
      </span>
      <span className="text-xs font-mono text-gray-500">USDC</span>
    </div>
  </div>
</div>
```

**Features**:
- ✅ Dark background
- ✅ Gold balance amount
- ✅ Tabular numbers
- ✅ USDC label

---

## 🎨 Card 2: ACTION_PANEL

### **Terminal Title Bar**:
```tsx
<div className="bg-gradient-to-r from-void-graphite to-void-graphite/80 border-b border-grail/30">
  <div className="flex items-center gap-2">
    <div className="w-1.5 h-1.5 rounded-full bg-profit animate-pulse shadow-lg shadow-profit/50"></div>
    <span className="text-xs font-mono">ACTION_PANEL</span>
  </div>
</div>
```

**Features**:
- ✅ Green blinking dot
- ✅ "ACTION_PANEL" label
- ✅ Gradient background

---

### **Market Sentiment**:
```tsx
<div className="p-4 border-b border-grail/20">
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <div className="w-1 h-1 rounded-full bg-grail"></div>
      <span className="text-xs font-mono text-gray-500 uppercase">Market_Sentiment</span>
    </div>
    <span className="text-xs text-gray-500 font-mono">{totalVotes} votes</span>
  </div>
  
  {/* Sentiment Bar */}
  <div className="relative h-2 bg-void-black rounded-full overflow-hidden mb-3 border border-grail/20">
    <div className="absolute left-0 top-0 h-full bg-profit" style={{ width: `${yesPercent}%` }} />
    <div className="absolute right-0 top-0 h-full bg-loss" style={{ width: `${noPercent}%` }} />
  </div>

  {/* Percentages */}
  <div className="flex justify-between text-xs font-mono font-bold">
    <span className="profit-text">{yesPercent}% YES</span>
    <span className="loss-text">{noPercent}% NO</span>
  </div>
</div>
```

**Features**:
- ✅ Purple dot indicator
- ✅ Vote count
- ✅ Dual-color progress bar
- ✅ Percentage display
- ✅ Border on bar

---

### **Action Buttons**:
```tsx
<div className="p-4">
  <div className="grid grid-cols-3 gap-3">
    {/* YES Button */}
    <button className="bg-gradient-to-br from-profit to-profit/80 hover:from-profit/90 hover:to-profit/70 
                       text-white font-bold py-6 rounded-lg transition-all hover:scale-105 
                       border border-profit/50 shadow-lg shadow-profit/20 font-mono">
      <div className="text-2xl mb-1">✓</div>
      <div className="text-sm">YES</div>
    </button>
    
    {/* SKIP Button */}
    <button className="bg-void-graphite hover:bg-void-graphite/60 text-gray-400 hover:text-white 
                       font-bold py-6 rounded-lg transition-all border border-grail/20 font-mono">
      <div className="text-2xl mb-1">→</div>
      <div className="text-sm">SKIP</div>
    </button>
    
    {/* NO Button */}
    <button className="bg-gradient-to-br from-loss to-loss/80 hover:from-loss/90 hover:to-loss/70 
                       text-white font-bold py-6 rounded-lg transition-all hover:scale-105 
                       border border-loss/50 shadow-lg shadow-loss/20 font-mono">
      <div className="text-2xl mb-1">✗</div>
      <div className="text-sm">NO</div>
    </button>
  </div>
</div>
```

**Features**:
- ✅ **YES**: Green gradient with glow
- ✅ **SKIP**: Gray with hover effect
- ✅ **NO**: Red gradient with glow
- ✅ Hover scale animation
- ✅ Border styling
- ✅ Monospace font

---

### **Instructions Footer**:
```tsx
<div className="p-4 bg-void-graphite/30 border-t border-grail/20">
  <div className="space-y-2 text-xs font-mono text-gray-500">
    <div className="flex items-center gap-2">
      <div className="w-1 h-1 rounded-full bg-profit"></div>
      <span>YES: Predict outcome will occur</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-1 h-1 rounded-full bg-loss"></div>
      <span>NO: Predict outcome won't occur</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-1 h-1 rounded-full bg-gray-500"></div>
      <span>SKIP: Pass to next prediction</span>
    </div>
  </div>
</div>
```

**Features**:
- ✅ Color-coded dots
- ✅ Clear instructions
- ✅ Monospace font
- ✅ Dark background

---

## 🎨 Color Coding

**Blue (Neon)**:
- PREDICTION_DATA indicator
- Resolution timer
- Betting timer (when open)

**Green (Profit)**:
- ACTION_PANEL indicator
- YES button
- YES sentiment bar
- YES instruction dot

**Red (Loss)**:
- NO button
- NO sentiment bar
- NO instruction dot
- Betting closed state

**Gold (Auric)**:
- Raw_Data indicator
- Balance amount

**Purple (Grail)**:
- Question indicator
- Market sentiment indicator
- Borders and accents

**Gray**:
- SKIP button
- SKIP instruction dot
- Labels and secondary text

---

## 📊 Layout Breakpoints

### **Large Desktop (≥ 1024px)**:
```css
lg:grid lg:grid-cols-2 lg:gap-4
```
- ✅ Two-column grid
- ✅ 4-unit gap
- ✅ Cards side-by-side

### **Tablet (768px - 1023px)**:
```css
mb-4 (on first card)
```
- ✅ Single column
- ✅ Cards stacked
- ✅ 4-unit margin between

### **Mobile (< 768px)**:
```css
mb-4 (on first card)
```
- ✅ Single column
- ✅ Cards stacked
- ✅ Full width

---

## ✅ New Features Added

### **1. Raw Data Display**:
- ✅ Shows `prediction.raw_text`
- ✅ Gold indicator dot
- ✅ Darker background
- ✅ Only appears if data exists

### **2. Terminal Styling**:
- ✅ Title bars on both cards
- ✅ Blinking indicators
- ✅ Monospace fonts throughout
- ✅ Border separators
- ✅ Gradient backgrounds

### **3. Responsive Grid**:
- ✅ Desktop: Side-by-side cards
- ✅ Mobile/Tablet: Stacked cards
- ✅ Proper spacing
- ✅ Smooth transitions

### **4. Enhanced Buttons**:
- ✅ Gradient backgrounds
- ✅ Glow shadows
- ✅ Hover animations
- ✅ Border styling
- ✅ Disabled states

### **5. Instructions Section**:
- ✅ Clear action descriptions
- ✅ Color-coded dots
- ✅ Monospace font
- ✅ Professional layout

---

## 📱 Responsive Behavior

### **Desktop Experience**:
```
User sees both cards simultaneously
├─ Left: All prediction data
├─ Right: Actions and sentiment
└─ Efficient use of screen space
```

### **Mobile/Tablet Experience**:
```
User scrolls through cards vertically
├─ First: Prediction data (read)
├─ Scroll down
└─ Second: Actions (interact)
```

---

## 🎯 Visual Hierarchy

```
1. Terminal Title Bars (identify sections)
   ↓
2. Asset Header (what asset)
   ↓
3. Question (what to predict)
   ↓
4. Raw Data (source information)
   ↓
5. Betting Timer (urgency)
   ↓
6. Balance (available funds)

---

7. Market Sentiment (crowd wisdom)
   ↓
8. Action Buttons (make decision)
   ↓
9. Instructions (guidance)
```

---

## 🏆 Result

**Prediction cards are now**:
- ✅ **Terminal-styled** - Matches platform aesthetic
- ✅ **Informative** - Shows raw_text data
- ✅ **Responsive** - Multi-grid on desktop, single on mobile
- ✅ **Professional** - Sleek design with gradients
- ✅ **Interactive** - Enhanced buttons with animations
- ✅ **Clear** - Instructions and color coding

**Users can**:
- See all prediction data clearly
- View raw source information
- Understand market sentiment
- Make informed decisions
- Use on any device
- Experience consistent design

**The prediction interface is now world-class!** 🎯✨🚀
