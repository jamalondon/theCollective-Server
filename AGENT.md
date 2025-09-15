# 🤖 Welcome to Your AI Coding Agent Guidelines

Hey there, fellow coder! This folder is your go-to reference for writing clean, friendly, and efficient code that’s easy to maintain and delightful to read. Whether you're building UI components or backend logic, these principles will keep our codebase joyful and sane.

---

## ✨ Coding Philosophy

- **Small is beautiful**: Break down logic into bite-sized components and modules.
- **Comments are kindness**: Explain _why_, not just _what_. Your future self will thank you.
- **No duplication**: DRY (Don't Repeat Yourself) is our mantra.
- **Friendly UI**: Code should feel welcoming—use clear naming, helpful comments, and intuitive structure.

---

## ✅ Do

- 🔹 **Use small components**  
  Keep components focused. If it’s doing more than one thing, it’s probably doing too much.

- 🔹 **Keep files and diffs small**  
  Easier to review, easier to debug. Avoid sweeping changes unless explicitly requested.

- 🔹 **Comment generously**  
  Every function, class, and tricky block should have a comment explaining its purpose.

- 🔹 **Use existing components**  
  If a reusable component exists, use it! Don’t reinvent the wheel.

---

## 🚫 Don't

- ❌ **Avoid raw `div`s**  
  If a styled or semantic component exists, use that instead. It keeps the UI consistent and accessible.

- ❌ **No heavy dependencies without approval**  
  Every new dependency adds weight. Check with the team before adding anything bulky.

- ❌ **Don’t duplicate logic**  
  If you find yourself copy-pasting, pause and refactor into a shared utility or component.

---

## 🧠 Tips for Writing Friendly Code

- Use **descriptive names**: `handleSubmit()` is better than `doThing()`.
- Prefer **early returns** over nested conditionals.
- Keep **functions short**—ideally under 30 lines.
- Use **consistent formatting** and linting rules.
- Write **unit tests** for critical logic.

---

## 📚 Folder Structure Suggestions

- Consistency: Use the same naming conventions and structure patterns across all projects
- Clarity: Folder names should clearly indicate their purpose
- Scalability: Structure should accommodate growth from small to large projects
- Separation of Concerns: Group related files together, separate different types of functionality
- Convention Over Configuration: Follow established patterns from popular frameworks and tools
