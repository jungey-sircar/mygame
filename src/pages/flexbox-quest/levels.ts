export interface FrogConfig {
  color: string;
  /** CSS class selector for individual frog styling (e.g. ".yellow") */
  selector?: string;
}

export interface Level {
  id: number;
  instructions: string;
  before: string;
  after: string;
  board: {
    frogs: FrogConfig[];
    /** Number of columns in the board grid visualization */
    columns?: number;
  };
  answer: string;
  /** CSS property name(s) being taught */
  properties: string[];
  /** Hint text */
  hint?: string;
}

const levels: Level[] = [
  // ─── WORLD 1: justify-content ─────────────────────────────────
  {
    id: 1,
    instructions:
      "Welcome to Flexbox Quest! Help the frog get to the lily pad on the right side of the pond using the <code>justify-content</code> property, which aligns items horizontally and accepts the following values:<ul><li><code>flex-start</code>: Items align to the left side of the container.</li><li><code>flex-end</code>: Items align to the right side of the container.</li><li><code>center</code>: Items align at the center of the container.</li><li><code>space-between</code>: Items display with equal spacing between them.</li><li><code>space-around</code>: Items display with equal spacing around them.</li></ul>",
    before: "#pond {\n  display: flex;\n",
    after: "\n}",
    board: {
      frogs: [{ color: "green" }],
    },
    answer: "justify-content: flex-end;",
    properties: ["justify-content"],
    hint: "Try justify-content: flex-end;",
  },
  {
    id: 2,
    instructions:
      "Use <code>justify-content</code> again to help these frogs get to the center of the pond.",
    before: "#pond {\n  display: flex;\n",
    after: "\n}",
    board: {
      frogs: [{ color: "green" }, { color: "green" }],
    },
    answer: "justify-content: center;",
    properties: ["justify-content"],
    hint: "The frogs need to be centered.",
  },
  {
    id: 3,
    instructions:
      "This time, spread the frogs to the edges using <code>justify-content: space-around</code>. Notice how the frogs get equal spacing around them.",
    before: "#pond {\n  display: flex;\n",
    after: "\n}",
    board: {
      frogs: [
        { color: "green" },
        { color: "green" },
        { color: "green" },
      ],
    },
    answer: "justify-content: space-around;",
    properties: ["justify-content"],
    hint: "space-around gives equal space around each item.",
  },
  {
    id: 4,
    instructions:
      "Now use <code>justify-content: space-between</code> to give the frogs equal spacing between them — with no space on the edges.",
    before: "#pond {\n  display: flex;\n",
    after: "\n}",
    board: {
      frogs: [
        { color: "green" },
        { color: "green" },
        { color: "green" },
      ],
    },
    answer: "justify-content: space-between;",
    properties: ["justify-content"],
    hint: "space-between puts space between items, but not on the edges.",
  },

  // ─── WORLD 2: align-items ─────────────────────────────────────
  {
    id: 5,
    instructions:
      "Now move the frog to the bottom of the pond using <code>align-items</code>, which aligns items vertically and accepts the following values:<ul><li><code>flex-start</code>: Items align to the top of the container.</li><li><code>flex-end</code>: Items align to the bottom of the container.</li><li><code>center</code>: Items align at the vertical center of the container.</li><li><code>baseline</code>: Items display at the baseline of the container.</li><li><code>stretch</code>: Items are stretched to fit the container.</li></ul>",
    before: "#pond {\n  display: flex;\n",
    after: "\n}",
    board: {
      frogs: [{ color: "yellow" }],
    },
    answer: "align-items: flex-end;",
    properties: ["align-items"],
    hint: "align-items controls vertical alignment. flex-end means bottom.",
  },
  {
    id: 6,
    instructions:
      "Center the frog vertically in the pond using <code>align-items</code>.",
    before: "#pond {\n  display: flex;\n",
    after: "\n}",
    board: {
      frogs: [{ color: "yellow" }],
    },
    answer: "align-items: center;",
    properties: ["align-items"],
    hint: "Use align-items: center; to center vertically.",
  },

  // ─── WORLD 3: justify-content + align-items ───────────────────
  {
    id: 7,
    instructions:
      "Move the frog to the bottom-right corner! You'll need to use both <code>justify-content</code> and <code>align-items</code>.",
    before: "#pond {\n  display: flex;\n",
    after: "\n}",
    board: {
      frogs: [{ color: "green" }],
    },
    answer: "justify-content: flex-end;\nalign-items: flex-end;",
    properties: ["justify-content", "align-items"],
    hint: "Combine justify-content and align-items. Both need flex-end.",
  },
  {
    id: 8,
    instructions:
      "Center the frogs both horizontally and vertically in the pond.",
    before: "#pond {\n  display: flex;\n",
    after: "\n}",
    board: {
      frogs: [
        { color: "green" },
        { color: "yellow" },
        { color: "red" },
      ],
    },
    answer: "justify-content: center;\nalign-items: center;",
    properties: ["justify-content", "align-items"],
    hint: "Use center for both justify-content and align-items.",
  },
  {
    id: 9,
    instructions:
      "Spread the frogs evenly and align them to the bottom of the pond.",
    before: "#pond {\n  display: flex;\n",
    after: "\n}",
    board: {
      frogs: [
        { color: "green" },
        { color: "green" },
        { color: "green" },
      ],
    },
    answer: "justify-content: space-around;\nalign-items: flex-end;",
    properties: ["justify-content", "align-items"],
    hint: "Use space-around horizontally and flex-end vertically.",
  },

  // ─── WORLD 4: flex-direction ──────────────────────────────────
  {
    id: 10,
    instructions:
      "The frogs need to be arranged in a column! Use <code>flex-direction</code> to set the direction of items in the container:<ul><li><code>row</code>: Items are placed left to right (default).</li><li><code>row-reverse</code>: Items are placed right to left.</li><li><code>column</code>: Items are placed top to bottom.</li><li><code>column-reverse</code>: Items are placed bottom to top.</li></ul>",
    before: "#pond {\n  display: flex;\n",
    after: "\n}",
    board: {
      frogs: [
        { color: "green" },
        { color: "green" },
        { color: "green" },
      ],
    },
    answer: "flex-direction: column;",
    properties: ["flex-direction"],
    hint: "Use flex-direction: column; to stack items vertically.",
  },
  {
    id: 11,
    instructions:
      "Reverse the order of the frogs in a row using <code>flex-direction</code>.",
    before: "#pond {\n  display: flex;\n",
    after: "\n}",
    board: {
      frogs: [
        { color: "red" },
        { color: "yellow" },
        { color: "green" },
      ],
    },
    answer: "flex-direction: row-reverse;",
    properties: ["flex-direction"],
    hint: "row-reverse places items from right to left.",
  },
  {
    id: 12,
    instructions:
      "Help the frogs reach their lily pads by reversing their column direction and aligning to the end.",
    before: "#pond {\n  display: flex;\n",
    after: "\n}",
    board: {
      frogs: [
        { color: "green" },
        { color: "green" },
        { color: "green" },
      ],
    },
    answer: "flex-direction: column-reverse;",
    properties: ["flex-direction"],
    hint: "column-reverse stacks items from bottom to top.",
  },
  {
    id: 13,
    instructions:
      "Combine <code>flex-direction</code> and <code>justify-content</code> to move the frogs. Remember: when the direction is column, justify-content works vertically!",
    before: "#pond {\n  display: flex;\n",
    after: "\n}",
    board: {
      frogs: [
        { color: "yellow" },
        { color: "yellow" },
      ],
    },
    answer: "flex-direction: column;\njustify-content: flex-end;",
    properties: ["flex-direction", "justify-content"],
    hint: "With column direction, justify-content moves items vertically.",
  },
  {
    id: 14,
    instructions:
      "Use <code>flex-direction</code>, <code>justify-content</code>, and <code>align-items</code> to move the frog to the bottom-right corner. With column direction, axes are swapped!",
    before: "#pond {\n  display: flex;\n",
    after: "\n}",
    board: {
      frogs: [{ color: "green" }],
    },
    answer:
      "flex-direction: column;\njustify-content: flex-end;\nalign-items: flex-end;",
    properties: ["flex-direction", "justify-content", "align-items"],
    hint: "In column mode: justify-content = vertical, align-items = horizontal.",
  },

  // ─── WORLD 5: order ───────────────────────────────────────────
  {
    id: 15,
    instructions:
      "Sometimes reversing is not enough. Use the <code>order</code> property on individual items to rearrange them. By default, items have an order of 0. Set a positive or negative integer value.",
    before: "#pond {\n  display: flex;\n}\n\n.yellow {\n",
    after: "\n}",
    board: {
      frogs: [
        { color: "red" },
        { color: "yellow", selector: ".yellow" },
        { color: "red" },
      ],
    },
    answer: "order: 1;",
    properties: ["order"],
    hint: "Set order to a positive number to push the yellow frog to the end.",
  },
  {
    id: 16,
    instructions:
      "Use <code>order</code> to bring the red frog before the others. Negative values move items earlier.",
    before: "#pond {\n  display: flex;\n}\n\n.red {\n",
    after: "\n}",
    board: {
      frogs: [
        { color: "green" },
        { color: "green" },
        { color: "red", selector: ".red" },
      ],
    },
    answer: "order: -1;",
    properties: ["order"],
    hint: "A negative order value moves the item before items with order: 0.",
  },

  // ─── WORLD 6: align-self ──────────────────────────────────────
  {
    id: 17,
    instructions:
      "Use <code>align-self</code> to align a single frog independently. It accepts the same values as <code>align-items</code> but applies to a single item only.",
    before:
      "#pond {\n  display: flex;\n  align-items: flex-start;\n}\n\n.yellow {\n",
    after: "\n}",
    board: {
      frogs: [
        { color: "green" },
        { color: "green" },
        { color: "yellow", selector: ".yellow" },
        { color: "green" },
        { color: "green" },
      ],
    },
    answer: "align-self: flex-end;",
    properties: ["align-self"],
    hint: "align-self overrides align-items for a single item.",
  },
  {
    id: 18,
    instructions:
      "Use a combination of <code>order</code> and <code>align-self</code> to move the yellow frog to the right corner.",
    before:
      "#pond {\n  display: flex;\n  align-items: flex-start;\n}\n\n.yellow {\n",
    after: "\n}",
    board: {
      frogs: [
        { color: "green" },
        { color: "yellow", selector: ".yellow" },
        { color: "green" },
        { color: "green" },
        { color: "green" },
      ],
    },
    answer: "order: 1;\nalign-self: flex-end;",
    properties: ["order", "align-self"],
    hint: "Combine order (to move right) with align-self (to move down).",
  },

  // ─── WORLD 7: flex-wrap ───────────────────────────────────────
  {
    id: 19,
    instructions:
      "These frogs are overflowing! Use <code>flex-wrap</code> to allow them to wrap to the next line:<ul><li><code>nowrap</code>: Every item fits on a single line (default).</li><li><code>wrap</code>: Items wrap to additional lines.</li><li><code>wrap-reverse</code>: Items wrap to additional lines in reverse.</li></ul>",
    before: "#pond {\n  display: flex;\n",
    after: "\n}",
    board: {
      frogs: [
        { color: "green" },
        { color: "green" },
        { color: "green" },
        { color: "green" },
        { color: "green" },
      ],
    },
    answer: "flex-wrap: wrap;",
    properties: ["flex-wrap"],
    hint: "flex-wrap: wrap; lets items flow onto new lines.",
  },
  {
    id: 20,
    instructions:
      "Combine <code>flex-direction</code> and <code>flex-wrap</code> using the shorthand <code>flex-flow</code>. It takes two values: direction and wrap.",
    before: "#pond {\n  display: flex;\n",
    after: "\n}",
    board: {
      frogs: [
        { color: "green" },
        { color: "green" },
        { color: "green" },
        { color: "green" },
        { color: "green" },
      ],
    },
    answer: "flex-flow: column wrap;",
    properties: ["flex-flow"],
    hint: "flex-flow: column wrap; combines direction and wrap.",
  },

  // ─── WORLD 8: align-content ───────────────────────────────────
  {
    id: 21,
    instructions:
      "Use <code>align-content</code> to set how multiple lines of items are spaced. It works like <code>justify-content</code> but on the cross axis:<ul><li><code>flex-start</code>: Lines are packed at the top of the container.</li><li><code>flex-end</code>: Lines are packed at the bottom.</li><li><code>center</code>: Lines are packed at the center.</li><li><code>space-between</code>: Lines display with equal spacing between them.</li><li><code>space-around</code>: Lines display with equal spacing around them.</li><li><code>stretch</code>: Lines are stretched to fit the container.</li></ul>",
    before: "#pond {\n  display: flex;\n  flex-wrap: wrap;\n",
    after: "\n}",
    board: {
      frogs: [
        { color: "yellow" },
        { color: "yellow" },
        { color: "yellow" },
        { color: "yellow" },
        { color: "yellow" },
        { color: "yellow" },
      ],
    },
    answer: "align-content: flex-start;",
    properties: ["align-content"],
    hint: "align-content controls how wrapped lines are distributed.",
  },
  {
    id: 22,
    instructions:
      "Center the rows of frogs vertically using <code>align-content</code>. Remember the items must be wrapping for this to work.",
    before: "#pond {\n  display: flex;\n  flex-wrap: wrap;\n",
    after: "\n}",
    board: {
      frogs: [
        { color: "green" },
        { color: "green" },
        { color: "green" },
        { color: "green" },
        { color: "green" },
        { color: "green" },
      ],
    },
    answer: "align-content: center;",
    properties: ["align-content"],
    hint: "align-content: center; centers wrapped lines.",
  },

  // ─── WORLD 9: Combined Boss Levels ────────────────────────────
  {
    id: 23,
    instructions:
      "Almost there! Use <code>flex-direction</code>, <code>justify-content</code>, <code>align-items</code>, and <code>flex-wrap</code> together to position these frogs.",
    before: "#pond {\n  display: flex;\n",
    after: "\n}",
    board: {
      frogs: [
        { color: "green" },
        { color: "yellow" },
        { color: "red" },
        { color: "green" },
        { color: "yellow" },
        { color: "red" },
      ],
    },
    answer:
      "flex-direction: column-reverse;\nflex-wrap: wrap-reverse;\njustify-content: center;\nalign-content: space-between;",
    properties: [
      "flex-direction",
      "flex-wrap",
      "justify-content",
      "align-content",
    ],
    hint: "Combine column-reverse, wrap-reverse, center, and space-between.",
  },
  {
    id: 24,
    instructions:
      "🏆 <b>FINAL LEVEL!</b> Use everything you've learned — <code>flex-direction</code>, <code>justify-content</code>, <code>align-items</code>, <code>flex-wrap</code>, <code>align-content</code>, and <code>order</code> — to arrange all frogs on their matching lily pads. Good luck!",
    before: "#pond {\n  display: flex;\n",
    after: "\n}",
    board: {
      frogs: [
        { color: "red" },
        { color: "yellow" },
        { color: "green" },
        { color: "red" },
        { color: "yellow" },
      ],
    },
    answer:
      "flex-wrap: wrap;\nflex-direction: column-reverse;\nalign-content: space-between;\njustify-content: center;",
    properties: [
      "flex-direction",
      "flex-wrap",
      "justify-content",
      "align-content",
    ],
    hint: "This is the boss level — combine all the flexbox properties you've learned!",
  },
];

export default levels;
