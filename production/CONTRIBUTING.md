# Contributing to ICP

Thank you for your interest in contributing to the Integrated Campus Portal! This document provides guidelines and instructions for contributing.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)

## 📜 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. Please be respectful and constructive in your interactions.

### Our Standards

- ✅ Use welcoming and inclusive language
- ✅ Be respectful of differing viewpoints
- ✅ Accept constructive criticism gracefully
- ✅ Focus on what is best for the community
- ❌ No harassment or discriminatory behavior

## 🚀 Getting Started

### Prerequisites

1. Fork the repository
2. Clone your fork locally
3. Set up the development environment (see README.md)
4. Create a new branch for your feature

```bash
git clone https://github.com/your-username/ICP.git
cd ICP
git checkout -b feature/your-feature-name
```

## 💻 Development Process

### 1. Choose an Issue

- Check existing issues or create a new one
- Comment on the issue to let others know you're working on it
- Get approval for major changes before starting

### 2. Development

- Write clean, maintainable code
- Follow the coding standards (see below)
- Add tests for new features
- Update documentation as needed

### 3. Testing

- Test your changes thoroughly
- Ensure all existing tests pass
- Add new tests for new functionality

### 4. Documentation

- Update README.md if needed
- Add/update API documentation
- Include inline code comments

## 📝 Coding Standards

### PHP (Backend)

Follow PSR-12 coding standards:

```php
<?php
// Good
class StudentController
{
    public function getStudent(int $id): array
    {
        // Implementation
    }
}

// Bad
class student_controller {
    function GetStudent($id) {
        // Implementation
    }
}
```

**Key Points:**
- Use camelCase for methods
- Use PascalCase for classes
- Type hint parameters and return types
- Use meaningful variable names
- Add PHPDoc comments

### JavaScript/React (Frontend)

Follow ESLint configuration:

```javascript
// Good
const StudentCard = ({ student }) => {
  const [isLoading, setIsLoading] = useState(false);
  
  return (
    <div className="student-card">
      {student.name}
    </div>
  );
};

// Bad
function studentcard(props) {
  var loading = false;
  return <div>{props.student.name}</div>
}
```

**Key Points:**
- Use functional components with hooks
- Use camelCase for variables and functions
- Use PascalCase for components
- Destructure props
- Use const/let, never var

### CSS/Tailwind

```css
/* Good - BEM methodology */
.student-card {
  @apply bg-white rounded-lg shadow-md;
}

.student-card__header {
  @apply font-bold text-lg;
}

.student-card--featured {
  @apply border-2 border-blue-500;
}
```

### SQL

```sql
-- Good
SELECT 
    s.student_id,
    s.first_name,
    s.last_name,
    d.department_name
FROM students s
INNER JOIN departments d ON s.department_id = d.id
WHERE s.is_active = 1
ORDER BY s.last_name ASC;

-- Bad
select * from students where is_active=1
```

## 📝 Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
# Good commits
git commit -m "feat(auth): add JWT token refresh mechanism"
git commit -m "fix(student): resolve GPA calculation error"
git commit -m "docs(api): update authentication endpoints"

# Bad commits
git commit -m "fixed stuff"
git commit -m "updates"
git commit -m "WIP"
```

### Detailed Commit

```bash
feat(payments): add UPI payment integration

- Integrate Razorpay UPI gateway
- Add payment verification webhook
- Update payment status in database
- Add error handling for failed transactions

Closes #123
```

## 🔄 Pull Request Process

### Before Submitting

1. ✅ Ensure all tests pass
2. ✅ Update documentation
3. ✅ Follow coding standards
4. ✅ Rebase on latest main branch
5. ✅ Write clear commit messages

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests pass locally

## Screenshots (if applicable)
Add screenshots here

## Related Issues
Closes #issue_number
```

### Review Process

1. Submit PR with clear description
2. Wait for automated checks to pass
3. Address reviewer feedback
4. Get approval from maintainers
5. PR will be merged by maintainers

## 🧪 Testing

### Backend Tests (PHP)

```bash
cd backend
composer test
```

### Frontend Tests (React)

```bash
cd frontend
npm test
```

### Integration Tests

```bash
cd tests/integration
npm test
```

### Writing Tests

**Backend (PHPUnit)**
```php
public function testStudentCreation()
{
    $student = $this->createStudent([
        'first_name' => 'John',
        'last_name' => 'Doe'
    ]);
    
    $this->assertNotNull($student->id);
    $this->assertEquals('John', $student->first_name);
}
```

**Frontend (Jest)**
```javascript
test('renders student name', () => {
  const student = { name: 'John Doe' };
  render(<StudentCard student={student} />);
  expect(screen.getByText('John Doe')).toBeInTheDocument();
});
```

## 🐛 Reporting Bugs

### Bug Report Template

```markdown
**Describe the bug**
Clear description of the bug

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What should happen

**Screenshots**
If applicable

**Environment:**
- OS: [e.g., Windows 10]
- Browser: [e.g., Chrome 96]
- Version: [e.g., 1.0.0]

**Additional context**
Any other relevant information
```

## 💡 Feature Requests

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
Clear description of the problem

**Describe the solution you'd like**
Clear description of desired solution

**Describe alternatives you've considered**
Alternative solutions or features

**Additional context**
Mockups, examples, etc.
```

## 📞 Getting Help

- 📖 Check documentation in `docs/`
- 💬 Ask questions in discussions
- 📧 Email: dev@icp.edu

## 🎉 Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes
- Project documentation

Thank you for contributing to ICP! 🙏
