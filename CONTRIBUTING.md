# Contributing to NodeRoll 🤝

First off, thank you for considering contributing to NodeRoll! It's people like you that make NodeRoll such a great tool.

## Code of Conduct 📜

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Development Process 🔄

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Pull Request Process 🔀

1. Update the README.md with details of changes to the interface, if applicable.
2. Update the CHANGELOG.md with a note describing your changes.
3. The PR will be merged once you have the sign-off of two other developers.

## Any contributions you make will be under the MIT Software License 📝
In short, when you submit code changes, your submissions are understood to be under the same [MIT License](http://choosealicense.com/licenses/mit/) that covers the project. Feel free to contact the maintainers if that's a concern.

## Report bugs using GitHub's [issue tracker](https://github.com/NodeRoll/self-hosted-standalone/issues) 🐛
We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/NodeRoll/self-hosted-standalone/issues/new).

## Write bug reports with detail, background, and sample code 📝

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can.
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

## Development Setup 🛠️

```bash
# Clone your fork
git clone https://github.com/your-username/self-hosted-standalone.git

# Navigate to the newly cloned directory
cd self-hosted-standalone

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Run development server
npm run dev
```

### Commit Messages 📝

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation only changes
- `style:` changes that don't affect the meaning of the code
- `refactor:` code change that neither fixes a bug nor adds a feature
- `test:` adding missing tests
- `chore:` changes to the build process or auxiliary tools

Example: `feat: add user authentication system`

## Code Style 🎨

- We use ESLint for JavaScript linting
- Follow the existing code style
- Use meaningful variable names
- Comment your code when necessary
- Keep functions small and focused

## Testing 🧪

- Write unit tests for new features
- Ensure all tests pass before submitting PR
- Include integration tests when necessary
- Test edge cases

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Documentation 📚

- Update documentation for new features
- Use JSDoc for code documentation
- Keep README.md updated
- Add examples when helpful

## Questions? 💭

If you have any questions, please [open an issue](https://github.com/NodeRoll/self-hosted-standalone/issues/new).

Thank you for contributing to NodeRoll! 🙏
