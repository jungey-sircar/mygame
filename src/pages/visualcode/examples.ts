import { Language } from './interpreter';

export interface CodeExample {
  name: string;
  language: Language;
  code: string;
  description: string;
}

export const examples: CodeExample[] = [
  // ═══════════════════════════════════
  // PYTHON EXAMPLES
  // ═══════════════════════════════════
  {
    name: 'Variables & Types',
    language: 'python',
    description: 'Basic variable assignments and types',
    code: `name = "Alice"
age = 25
height = 5.6
is_student = True

print(name)
print(age)
print(height)
print(is_student)`,
  },
  {
    name: 'If-Elif-Else',
    language: 'python',
    description: 'Multi-branch conditional logic',
    code: `score = 75

if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
elif score >= 70:
    grade = "C"
elif score >= 60:
    grade = "D"
else:
    grade = "F"

print(grade)`,
  },
  {
    name: 'Nested Conditions',
    language: 'python',
    description: 'Conditions inside conditions',
    code: `x = 15

if x > 0:
    if x > 10:
        print("Greater than 10")
    else:
        print("Between 1 and 10")
else:
    print("Non-positive")

print("Done")`,
  },
  {
    name: 'While Loop',
    language: 'python',
    description: 'Counting with while loop',
    code: `count = 1
total = 0

while count <= 5:
    total += count
    print(total)
    count += 1

print(total)`,
  },
  {
    name: 'For Loop & Range',
    language: 'python',
    description: 'Iterating with for loop',
    code: `for i in range(1, 6):
    print(i * i)

total = 0
for i in range(1, 11):
    total += i

print(total)`,
  },
  {
    name: 'Nested Loops',
    language: 'python',
    description: 'Multiplication table pattern',
    code: `for i in range(1, 4):
    for j in range(1, 4):
        result = i * j
        print(result)
    print("---")`,
  },
  {
    name: 'List Operations',
    language: 'python',
    description: 'Creating and modifying lists',
    code: `fruits = ["apple", "banana", "cherry"]
print(fruits)

fruits.append("date")
print(fruits)
print(len(fruits))

first = fruits[0]
last = fruits[3]
print(first)
print(last)`,
  },
  {
    name: 'List with Loops',
    language: 'python',
    description: 'Processing list elements',
    code: `numbers = [4, 2, 7, 1, 9, 3]
n = len(numbers)

total = 0
for i in range(n):
    total += numbers[i]
    print(numbers[i])

average = total / n
print(average)`,
  },
    {
        name: 'Matrix Update',
        language: 'python',
        description: '2D array row updates and traversal',
        code: `matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]

row = matrix[1]
row[2] = 42

print(matrix)
print(row)`,
    },
    {
        name: 'Matrix Update',
        language: 'c',
        description: '2D array row updates and traversal',
        code: `#include <stdio.h>

    int main() {
        int matrix[3][3] = {{1, 2, 3}, {4, 5, 6}, {7, 8, 9}};
        matrix[1][2] = 42;
            printf("matrix[1][2] = %d\\n", matrix[1][2]);
            printf("matrix[0][0] = %d\\n", matrix[0][0]);
        return 0;
    }`,
    },
  {
    name: 'Functions',
    language: 'python',
    description: 'Defining and calling functions',
    code: `def greet(name):
    print(name)

def add(a, b):
    return a + b

def multiply(a, b):
    return a * b

greet("Alice")
result = add(3, 5)
print(result)
product = multiply(4, 6)
print(product)`,
  },
  {
    name: 'Factorial (Recursion)',
    language: 'python',
    description: 'Recursive function call',
    code: `def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

result = factorial(5)
print(result)`,
  },
  {
    name: 'Fibonacci',
    language: 'python',
    description: 'Fibonacci sequence with recursion',
    code: `def fib(n):
    if n <= 0:
        return 0
    if n == 1:
        return 1
    return fib(n - 1) + fib(n - 2)

for i in range(8):
    print(fib(i))`,
  },
  {
    name: 'Bubble Sort',
    language: 'python',
    description: 'Sorting algorithm visualization',
    code: `arr = [5, 3, 8, 1, 2]
n = len(arr)

for i in range(n):
    for j in range(n - 1):
        if arr[j] > arr[j + 1]:
            temp = arr[j]
            arr[j] = arr[j + 1]
            arr[j + 1] = temp

print(arr)`,
  },
  {
    name: 'Linear Search',
    language: 'python',
    description: 'Searching in a list',
    code: `def search(arr, target):
    for i in range(len(arr)):
        if arr[i] == target:
            return i
    return -1

numbers = [10, 25, 30, 45, 60]
pos = search(numbers, 30)
print(pos)

pos2 = search(numbers, 99)
print(pos2)`,
  },
  {
    name: 'Sum & Average',
    language: 'python',
    description: 'Computing stats from a list',
    code: `def compute_sum(arr):
    total = 0
    for i in range(len(arr)):
        total += arr[i]
    return total

data = [12, 45, 67, 23, 89]
s = compute_sum(data)
avg = s / len(data)
print(s)
print(avg)`,
  },
  {
    name: 'Power Function',
    language: 'python',
    description: 'Recursive exponentiation',
    code: `def power(base, exp):
    if exp == 0:
        return 1
    return base * power(base, exp - 1)

result = power(2, 8)
print(result)

result2 = power(3, 4)
print(result2)`,
  },
  {
    name: 'GCD (Euclid)',
    language: 'python',
    description: 'Greatest Common Divisor',
    code: `def gcd(a, b):
    if b == 0:
        return a
    return gcd(b, a % b)

result = gcd(48, 18)
print(result)

result2 = gcd(100, 75)
print(result2)`,
  },
    {
        name: 'Even or Odd',
        language: 'python',
        description: 'Check parity using modulo',
        code: `n = 42

if n % 2 == 0:
        print("Even")
else:
        print("Odd")`,
    },
    {
        name: 'Range with Step',
        language: 'python',
        description: 'Iterate using custom step values',
        code: `for i in range(2, 12, 2):
        print(i)

for j in range(10, 0, -2):
        print(j)`,
    },
    {
        name: 'Running Product',
        language: 'python',
        description: 'Accumulate multiplication in a loop',
        code: `product = 1

for i in range(1, 6):
        product = product * i
        print(product)

print(product)`,
    },
    {
        name: 'List Reverse',
        language: 'python',
        description: 'Reverse list content',
        code: `nums = [1, 2, 3, 4, 5]
rev = reversed(nums)
print(rev)

for i in range(len(rev)):
        print(rev[i])`,
    },
    {
        name: 'Sorted Values',
        language: 'python',
        description: 'Sort numbers using built-in sorted',
        code: `data = [9, 1, 7, 3, 2]
ordered = sorted(data)
print(ordered)

print(ordered[0])
print(ordered[len(ordered) - 1])`,
    },
    {
        name: 'Min Max Finder',
        language: 'python',
        description: 'Find smallest and largest value',
        code: `values = [18, 4, 29, 11, 7]
smallest = min(values)
largest = max(values)

print(smallest)
print(largest)`,
    },
    {
        name: 'Absolute Difference',
        language: 'python',
        description: 'Use abs() to measure distance',
        code: `a = 13
b = 28
diff = abs(a - b)

print(diff)`,
    },
    {
        name: 'String Number Conversion',
        language: 'python',
        description: 'Convert between strings and numbers',
        code: `raw = "42"
n = int(raw)
f = float(raw)
s = str(n + 8)

print(n)
print(f)
print(s)`,
    },
    {
        name: 'Sum of Squares',
        language: 'python',
        description: 'Function that computes squared sum',
        code: `def sum_squares(n):
        total = 0
        for i in range(1, n + 1):
                total += i * i
        return total

print(sum_squares(5))`,
    },
    {
        name: 'Prime Check',
        language: 'python',
        description: 'Simple prime detection with loop',
        code: `def is_prime(n):
        if n < 2:
                return False
        flag = True
        for i in range(2, n):
                if n % i == 0:
                        flag = False
        return flag

print(is_prime(17))
print(is_prime(18))`,
    },
    {
        name: 'Recursive Sum',
        language: 'python',
        description: 'Recursively sum first n numbers',
        code: `def total(n):
        if n <= 1:
                return n
        return n + total(n - 1)

print(total(6))`,
    },
    {
        name: 'Two Function Composition',
        language: 'python',
        description: 'Call functions inside functions',
        code: `def double(x):
        return x * 2

def plus_three(x):
        return x + 3

value = plus_three(double(5))
print(value)`,
    },
    {
        name: 'Nested Loop Coordinates',
        language: 'python',
        description: 'Print grid coordinates',
        code: `for r in range(1, 4):
        for c in range(1, 4):
                print(r)
                print(c)
        print("row done")`,
    },
    {
        name: 'Average with Function',
        language: 'python',
        description: 'Compute average using helper function',
        code: `def average(arr):
        total = sum(arr)
        return total / len(arr)

vals = [10, 20, 30, 40]
print(average(vals))`,
    },
    {
        name: 'Class Counter',
        language: 'python',
        description: 'OOP: class with state and methods',
        code: `class Counter:
        def __init__(self, start):
                self.value = start

        def inc(self):
                self.value = self.value + 1

        def show(self):
                print(self.value)

c = Counter(3)
c.inc()
c.show()`,
    },
    {
        name: 'Class Rectangle Area',
        language: 'python',
        description: 'OOP: return value from class method',
        code: `class Rectangle:
        def __init__(self, w, h):
                self.w = w
                self.h = h

        def area(self):
                return self.w * self.h

r = Rectangle(4, 6)
a = r.area()
print(a)`,
    },
    {
        name: 'Class Bank Account',
        language: 'python',
        description: 'OOP: update object fields',
        code: `class Account:
        def __init__(self, amount):
                self.balance = amount

        def deposit(self, value):
                self.balance = self.balance + value

        def withdraw(self, value):
                self.balance = self.balance - value

acc = Account(100)
acc.deposit(40)
acc.withdraw(15)
print(acc.balance)`,
    },
    {
        name: 'Class Student Grade',
        language: 'python',
        description: 'OOP: methods with condition logic',
        code: `class Student:
        def __init__(self, marks):
                self.marks = marks

        def grade(self):
                if self.marks >= 80:
                        return "A"
                if self.marks >= 60:
                        return "B"
                return "C"

s = Student(72)
print(s.grade())`,
    },
    {
        name: 'Class Distance',
        language: 'python',
        description: 'OOP: reusable computation method',
        code: `class Distance:
        def __init__(self, x1, x2):
                self.x1 = x1
                self.x2 = x2

        def diff(self):
                return abs(self.x1 - self.x2)

d = Distance(25, 7)
print(d.diff())`,
    },
    {
        name: 'Class Loop Interaction',
        language: 'python',
        description: 'OOP used inside loops',
        code: `class Tracker:
        def __init__(self):
                self.count = 0

        def add(self, n):
                self.count = self.count + n

t = Tracker()
for i in range(1, 5):
        t.add(i)
print(t.count)`,
    },

  // ═══════════════════════════════════
  // C EXAMPLES
  // ═══════════════════════════════════
  {
    name: 'Basic Variables',
    language: 'c',
    description: 'Variable declarations and arithmetic',
    code: `#include <stdio.h>

int main() {
    int a = 10;
    int b = 20;
    int sum = a + b;
    int diff = a - b;
    printf("Sum = %d\\n", sum);
    printf("Diff = %d\\n", diff);
    return 0;
}`,
  },
  {
    name: 'If-Else',
    language: 'c',
    description: 'Conditional branching in C',
    code: `#include <stdio.h>

int main() {
    int x = 15;
    int y = 20;
    if (x > y) {
        printf("x is greater\\n");
    } else {
        printf("y is greater\\n");
    }
    return 0;
}`,
  },
  {
    name: 'For Loop',
    language: 'c',
    description: 'Counting with for loop',
    code: `#include <stdio.h>

int main() {
    int total = 0;
    for (int i = 1; i <= 5; i++) {
        total += i;
        printf("i=%d total=%d\\n", i, total);
    }
    printf("Final = %d\\n", total);
    return 0;
}`,
  },
  {
    name: 'While Loop',
    language: 'c',
    description: 'While loop countdown',
    code: `#include <stdio.h>

int main() {
    int n = 5;
    int factorial = 1;
    int i = 1;
    while (i <= n) {
        factorial *= i;
        printf("%d\\n", factorial);
        i++;
    }
    printf("Result = %d\\n", factorial);
    return 0;
}`,
  },
  {
    name: 'Nested Loops',
    language: 'c',
    description: 'Multiplication table',
    code: `#include <stdio.h>

int main() {
    for (int i = 1; i <= 3; i++) {
        for (int j = 1; j <= 3; j++) {
            int product = i * j;
            printf("%d * %d = %d\\n", i, j, product);
        }
    }
    return 0;
}`,
  },
  {
    name: 'Arrays',
    language: 'c',
    description: 'Array declaration and traversal',
    code: `#include <stdio.h>

int main() {
    int arr[5];
    arr[0] = 10;
    arr[1] = 20;
    arr[2] = 30;
    arr[3] = 40;
    arr[4] = 50;
    int sum = 0;
    for (int i = 0; i < 5; i++) {
        sum += arr[i];
        printf("%d\\n", arr[i]);
    }
    printf("Sum = %d\\n", sum);
    return 0;
}`,
  },
  {
    name: 'Functions',
    language: 'c',
    description: 'Function definition and calls',
    code: `#include <stdio.h>

int add(int a, int b) {
    int result = a + b;
    return result;
}

int multiply(int a, int b) {
    int result = a * b;
    return result;
}

int main() {
    int x = 5;
    int y = 3;
    int sum = add(x, y);
    int prod = multiply(x, y);
    printf("Sum = %d\\n", sum);
    printf("Product = %d\\n", prod);
    return 0;
}`,
  },
  {
    name: 'Recursive Factorial',
    language: 'c',
    description: 'Recursion in C',
    code: `#include <stdio.h>

int factorial(int n) {
    if (n <= 1) {
        return 1;
    }
    return n * factorial(n - 1);
}

int main() {
    int result = factorial(5);
    printf("5! = %d\\n", result);
    return 0;
}`,
  },
  {
    name: 'String Length',
    language: 'c',
    description: 'Counting characters in a string',
    code: `#include <stdio.h>

int main() {
    char word[6];
    word[0] = 72;
    word[1] = 101;
    word[2] = 108;
    word[3] = 108;
    word[4] = 111;
    int length = 5;
    printf("Length = %d\\n", length);
    return 0;
}`,
  },
  {
    name: 'Swap Values',
    language: 'c',
    description: 'Swapping two variables',
    code: `#include <stdio.h>

int main() {
    int a = 10;
    int b = 20;
    printf("Before: a=%d b=%d\\n", a, b);
    int temp = a;
    a = b;
    b = temp;
    printf("After: a=%d b=%d\\n", a, b);
    return 0;
}`,
  },
  {
    name: 'Find Maximum',
    language: 'c',
    description: 'Finding max in array',
    code: `#include <stdio.h>

int main() {
    int arr[5];
    arr[0] = 34;
    arr[1] = 12;
    arr[2] = 67;
    arr[3] = 45;
    arr[4] = 23;
    int max = arr[0];
    for (int i = 1; i < 5; i++) {
        if (arr[i] > max) {
            max = arr[i];
        }
    }
    printf("Max = %d\\n", max);
    return 0;
}`,
  },
  {
    name: 'Sum of Digits',
    language: 'c',
    description: 'Extract and sum digits of a number',
    code: `#include <stdio.h>

int main() {
    int num = 1234;
    int sum = 0;
    int n = num;
    while (n > 0) {
        int digit = n % 10;
        sum += digit;
        printf("Digit: %d\\n", digit);
        n = n / 10;
    }
    printf("Sum = %d\\n", sum);
    return 0;
}`,
  },
  {
    name: 'Even Odd Number',
    language: 'c',
    description: 'Parity check using modulo',
    code: `#include <stdio.h>

int main() {
    int n = 27;
    if (n % 2 == 0) {
        printf("Even\\n");
    } else {
        printf("Odd\\n");
    }
    return 0;
}`,
  },
  {
    name: 'Sum 1 to N',
    language: 'c',
    description: 'Summation using loop',
    code: `#include <stdio.h>

int main() {
    int n = 10;
    int total = 0;
    for (int i = 1; i <= n; i++) {
        total += i;
    }
    printf("%d\\n", total);
    return 0;
}`,
  },
  {
    name: 'Power Iterative',
    language: 'c',
    description: 'Compute power with repeated multiply',
    code: `#include <stdio.h>

int main() {
    int base = 3;
    int exp = 4;
    int ans = 1;
    for (int i = 0; i < exp; i++) {
        ans *= base;
    }
    printf("%d\\n", ans);
    return 0;
}`,
  },
  {
    name: 'Reverse Number',
    language: 'c',
    description: 'Reverse digits in integer',
    code: `#include <stdio.h>

int main() {
    int n = 12345;
    int rev = 0;
    while (n > 0) {
        rev = rev * 10 + (n % 10);
        n = n / 10;
    }
    printf("%d\\n", rev);
    return 0;
}`,
  },
  {
    name: 'Count Digits',
    language: 'c',
    description: 'Count number of digits',
    code: `#include <stdio.h>

int main() {
    int n = 98760;
    int count = 0;
    while (n > 0) {
        count++;
        n = n / 10;
    }
    printf("%d\\n", count);
    return 0;
}`,
  },
  {
    name: 'Prime Flag Check',
    language: 'c',
    description: 'Prime detection without break',
    code: `#include <stdio.h>

int main() {
    int n = 19;
    int prime = 1;
    for (int i = 2; i < n; i++) {
        if (n % i == 0) {
            prime = 0;
        }
    }
    printf("%d\\n", prime);
    return 0;
}`,
  },
  {
    name: 'GCD Loop',
    language: 'c',
    description: 'Euclid algorithm with while loop',
    code: `#include <stdio.h>

int main() {
    int a = 48;
    int b = 18;
    while (b != 0) {
        int t = b;
        b = a % b;
        a = t;
    }
    printf("%d\\n", a);
    return 0;
}`,
  },
  {
    name: 'LCM from GCD',
    language: 'c',
    description: 'Use gcd result to compute lcm',
    code: `#include <stdio.h>

int gcd(int a, int b) {
    while (b != 0) {
        int t = b;
        b = a % b;
        a = t;
    }
    return a;
}

int main() {
    int x = 12;
    int y = 18;
    int g = gcd(x, y);
    int l = (x * y) / g;
    printf("%d\\n", l);
    return 0;
}`,
  },
  {
    name: 'Temperature Convert',
    language: 'c',
    description: 'Celsius to Fahrenheit conversion',
    code: `#include <stdio.h>

int main() {
    int c = 30;
    int f = (c * 9 / 5) + 32;
    printf("%d\\n", f);
    return 0;
}`,
  },
  {
    name: 'Leap Year',
    language: 'c',
    description: 'Classic leap-year condition',
    code: `#include <stdio.h>

int main() {
    int y = 2024;
    int leap = 0;
    if (y % 400 == 0) {
        leap = 1;
    } else if (y % 100 == 0) {
        leap = 0;
    } else if (y % 4 == 0) {
        leap = 1;
    }
    printf("%d\\n", leap);
    return 0;
}`,
  },
  {
    name: 'ASCII Character',
    language: 'c',
    description: 'Print ASCII code of character',
    code: `#include <stdio.h>

int main() {
    char ch = 'A';
    int code = ch;
    printf("%d\\n", code);
    return 0;
}`,
  },
  {
    name: 'Simple Interest',
    language: 'c',
    description: 'Finance formula with ints',
    code: `#include <stdio.h>

int main() {
    int p = 1000;
    int r = 5;
    int t = 2;
    int si = (p * r * t) / 100;
    printf("%d\\n", si);
    return 0;
}`,
  },
  {
    name: 'Function Square',
    language: 'c',
    description: 'Function returning square value',
    code: `#include <stdio.h>

int square(int x) {
    return x * x;
}

int main() {
    int a = 9;
    int s = square(a);
    printf("%d\\n", s);
    return 0;
}`,
  },
  {
    name: 'Function Cube',
    language: 'c',
    description: 'Function returning cube value',
    code: `#include <stdio.h>

int cube(int x) {
    return x * x * x;
}

int main() {
    printf("%d\\n", cube(4));
    return 0;
}`,
  },
  {
    name: 'Recursive Sum',
    language: 'c',
    description: 'Recursive natural-number sum',
    code: `#include <stdio.h>

int sumN(int n) {
    if (n <= 1) return n;
    return n + sumN(n - 1);
}

int main() {
    printf("%d\\n", sumN(6));
    return 0;
}`,
  },
  {
    name: 'Recursive Power',
    language: 'c',
    description: 'Power function with recursion',
    code: `#include <stdio.h>

int power(int b, int e) {
    if (e == 0) return 1;
    return b * power(b, e - 1);
}

int main() {
    printf("%d\\n", power(2, 10));
    return 0;
}`,
  },
  {
    name: 'Multiplication by Addition',
    language: 'c',
    description: 'Multiply two numbers with loops',
    code: `#include <stdio.h>

int main() {
    int a = 7;
    int b = 4;
    int result = 0;
    for (int i = 0; i < b; i++) {
        result += a;
    }
    printf("%d\\n", result);
    return 0;
}`,
  },
  {
    name: 'Pattern Steps',
    language: 'c',
    description: 'Nested loops for pattern count',
    code: `#include <stdio.h>

int main() {
    int count = 0;
    for (int i = 1; i <= 4; i++) {
        for (int j = 1; j <= i; j++) {
            count++;
        }
    }
    printf("%d\\n", count);
    return 0;
}`,
  },
  {
    name: 'Max of Three',
    language: 'c',
    description: 'Find maximum of three integers',
    code: `#include <stdio.h>

int main() {
    int a = 21;
    int b = 45;
    int c = 33;
    int m = a;
    if (b > m) m = b;
    if (c > m) m = c;
    printf("%d\\n", m);
    return 0;
}`,
  },
  {
    name: 'Average of Three',
    language: 'c',
    description: 'Compute integer average',
    code: `#include <stdio.h>

int main() {
    int a = 10;
    int b = 20;
    int c = 30;
    int avg = (a + b + c) / 3;
    printf("%d\\n", avg);
    return 0;
}`,
  },

  // ═══════════════════════════════════
  // JAVASCRIPT EXAMPLES
  // ═══════════════════════════════════
  {
    name: 'Variables & Types',
    language: 'javascript',
    description: 'Basic variable declarations and types',
    code: `let name = "Alice"
let age = 25
let height = 5.6
let isStudent = true

console.log(name)
console.log(age)
console.log(height)
console.log(isStudent)`,
  },
  {
    name: 'If-Else If-Else',
    language: 'javascript',
    description: 'Multi-branch conditional logic',
    code: `let score = 75
let grade = ""

if (score >= 90) {
    grade = "A"
} else if (score >= 80) {
    grade = "B"
} else if (score >= 70) {
    grade = "C"
} else if (score >= 60) {
    grade = "D"
} else {
    grade = "F"
}

console.log(grade)`,
  },
  {
    name: 'Nested Conditions',
    language: 'javascript',
    description: 'Conditions inside conditions',
    code: `let x = 15

if (x > 0) {
    if (x > 10) {
        console.log("Greater than 10")
    } else {
        console.log("Between 1 and 10")
    }
} else {
    console.log("Non-positive")
}

console.log("Done")`,
  },
  {
    name: 'For Loop',
    language: 'javascript',
    description: 'Counting with a for loop',
    code: `let total = 0

for (let i = 1; i <= 5; i++) {
    total += i
    console.log(total)
}

console.log(total)`,
  },
  {
    name: 'While Loop',
    language: 'javascript',
    description: 'Counting with a while loop',
    code: `let count = 1
let total = 0

while (count <= 5) {
    total += count
    console.log(total)
    count++
}

console.log(total)`,
  },
  {
    name: 'Nested Loops',
    language: 'javascript',
    description: 'Multiplication table pattern',
    code: `for (let i = 1; i <= 3; i++) {
    for (let j = 1; j <= 3; j++) {
        let result = i * j
        console.log(result)
    }
    console.log("---")
}`,
  },
  {
    name: 'Array Operations',
    language: 'javascript',
    description: 'Creating and modifying arrays',
    code: `let fruits = ["apple", "banana", "cherry"]
console.log(fruits)

fruits.push("date")
console.log(fruits)
console.log(fruits.length)

let first = fruits[0]
let last = fruits[3]
console.log(first)
console.log(last)`,
  },
  {
    name: 'Array with Loops',
    language: 'javascript',
    description: 'Processing array elements',
    code: `let numbers = [4, 2, 7, 1, 9, 3]
let n = numbers.length

let total = 0
for (let i = 0; i < n; i++) {
    total += numbers[i]
    console.log(numbers[i])
}

let average = total / n
console.log(average)`,
  },
  {
    name: 'Objects',
    language: 'javascript',
    description: 'Working with object properties',
    code: `let name = "Alice"
let age = 25
let city = "NYC"

console.log(name)
console.log(age)
console.log(city)

age = 26
console.log(age)`,
  },
  {
    name: 'Functions',
    language: 'javascript',
    description: 'Defining and calling functions',
    code: `function greet(name) {
    console.log(name)
}

function add(a, b) {
    return a + b
}

function multiply(a, b) {
    return a * b
}

greet("Alice")
let result = add(3, 5)
console.log(result)
let product = multiply(4, 6)
console.log(product)`,
  },
  {
    name: 'Factorial (Recursion)',
    language: 'javascript',
    description: 'Recursive function call',
    code: `function factorial(n) {
    if (n <= 1) {
        return 1
    }
    return n * factorial(n - 1)
}

let result = factorial(5)
console.log(result)`,
  },
  {
    name: 'Fibonacci',
    language: 'javascript',
    description: 'Fibonacci with recursion',
    code: `function fib(n) {
    if (n <= 0) {
        return 0
    }
    if (n === 1) {
        return 1
    }
    return fib(n - 1) + fib(n - 2)
}

for (let i = 0; i < 8; i++) {
    console.log(fib(i))
}`,
  },
  {
    name: 'Bubble Sort',
    language: 'javascript',
    description: 'Sorting algorithm visualization',
    code: `let arr = [5, 3, 8, 1, 2]
let n = arr.length

for (let i = 0; i < n; i++) {
    for (let j = 0; j < n - 1; j++) {
        if (arr[j] > arr[j + 1]) {
            let temp = arr[j]
            arr[j] = arr[j + 1]
            arr[j + 1] = temp
        }
    }
}

console.log(arr)`,
  },
    {
        name: 'Matrix Update',
        language: 'javascript',
        description: '2D array update through row reference',
        code: `let matrix = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9]
]

let row = matrix[1]
row[2] = 42

for (let i = 0; i < matrix.length; i++) {
        console.log(matrix[i])
}`,
    },
  {
    name: 'Linear Search',
    language: 'javascript',
    description: 'Searching in an array',
    code: `function search(arr, target) {
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] === target) {
            return i
        }
    }
    return -1
}

let numbers = [10, 25, 30, 45, 60]
let pos = search(numbers, 30)
console.log(pos)

let pos2 = search(numbers, 99)
console.log(pos2)`,
  },
  {
    name: 'Find Maximum',
    language: 'javascript',
    description: 'Finding max in an array',
    code: `let arr = [34, 12, 67, 45, 23]
let max = arr[0]

for (let i = 1; i < arr.length; i++) {
    if (arr[i] > max) {
        max = arr[i]
    }
}

console.log(max)`,
  },
  {
    name: 'Sum & Average',
    language: 'javascript',
    description: 'Computing stats from an array',
    code: `function computeSum(arr) {
    let total = 0
    for (let i = 0; i < arr.length; i++) {
        total += arr[i]
    }
    return total
}

let data = [12, 45, 67, 23, 89]
let s = computeSum(data)
let avg = s / data.length
console.log(s)
console.log(avg)`,
  },
  {
    name: 'GCD (Euclid)',
    language: 'javascript',
    description: 'Greatest Common Divisor',
    code: `function gcd(a, b) {
    if (b === 0) {
        return a
    }
    return gcd(b, a % b)
}

let result = gcd(48, 18)
console.log(result)

let result2 = gcd(100, 75)
console.log(result2)`,
  },
  {
    name: 'Swap Values',
    language: 'javascript',
    description: 'Swapping two variables',
    code: `let a = 10
let b = 20
console.log(a)
console.log(b)

let temp = a
a = b
b = temp
console.log(a)
console.log(b)`,
  },
    {
        name: 'Even or Odd',
        language: 'javascript',
        description: 'Check parity with modulo',
        code: `let n = 31

if (n % 2 === 0) {
        console.log("Even")
} else {
        console.log("Odd")
}`,
    },
    {
        name: 'Range Sum',
        language: 'javascript',
        description: 'Sum values from 1 to n',
        code: `let n = 10
let total = 0

for (let i = 1; i <= n; i++) {
        total += i
}

console.log(total)`,
    },
    {
        name: 'Countdown While',
        language: 'javascript',
        description: 'Decrement in while loop',
        code: `let n = 5

while (n > 0) {
        console.log(n)
        n--
}

console.log("done")`,
    },
    {
        name: 'Array Reverse',
        language: 'javascript',
        description: 'Reverse array in place',
        code: `let arr = [1, 2, 3, 4]
arr.reverse()
console.log(arr)

for (let i = 0; i < arr.length; i++) {
        console.log(arr[i])
}`,
    },
    {
        name: 'Array Push Pop',
        language: 'javascript',
        description: 'Mutate arrays with push and pop',
        code: `let data = [10, 20]
data.push(30)
data.push(40)
console.log(data)

data.pop()
console.log(data)`,
    },
    {
        name: 'Object Literal Access',
        language: 'javascript',
        description: 'Read object fields',
        code: `let user = { name: "Alice", score: 88 }
console.log(user.name)
console.log(user.score)

user.score = user.score + 5
console.log(user.score)`,
    },
    {
        name: 'Factorial Iterative',
        language: 'javascript',
        description: 'Factorial without recursion',
        code: `let n = 5
let fact = 1

for (let i = 1; i <= n; i++) {
        fact *= i
}

console.log(fact)`,
    },
    {
        name: 'Average Function',
        language: 'javascript',
        description: 'Function to calculate average',
        code: `function average(arr) {
        let s = 0
        for (let i = 0; i < arr.length; i++) {
                s += arr[i]
        }
        return s / arr.length
}

console.log(average([5, 10, 15, 20]))`,
    },
    {
        name: 'Prime Check',
        language: 'javascript',
        description: 'Detect prime numbers',
        code: `function isPrime(n) {
        if (n < 2) return false
        let ok = true
        for (let i = 2; i < n; i++) {
                if (n % i === 0) ok = false
        }
        return ok
}

console.log(isPrime(13))
console.log(isPrime(15))`,
    },
    {
        name: 'Recursive Sum',
        language: 'javascript',
        description: 'Sum first n numbers recursively',
        code: `function sumN(n) {
        if (n <= 1) {
                return n
        }
        return n + sumN(n - 1)
}

console.log(sumN(7))`,
    },
    {
        name: 'Math Parsing',
        language: 'javascript',
        description: 'parseInt and Number usage',
        code: `let a = parseInt("24")
let b = Number("6")
let c = a / b

console.log(a)
console.log(b)
console.log(c)`,
    },
    {
        name: 'Nested Grid Counter',
        language: 'javascript',
        description: 'Nested loop cell counting',
        code: `let count = 0

for (let r = 1; r <= 3; r++) {
        for (let c = 1; c <= 4; c++) {
                count++
        }
}

console.log(count)`,
    },
    {
        name: 'Class Person',
        language: 'javascript',
        description: 'OOP: class with constructor and method',
        code: `class Person {
        constructor(name, age) {
                this.name = name
                this.age = age
        }

        describe() {
                console.log(this.name)
                console.log(this.age)
        }
}

let p = new Person("Riya", 19)
p.describe()`,
    },
    {
        name: 'Class Counter',
        language: 'javascript',
        description: 'OOP: mutable state in object',
        code: `class Counter {
        constructor(start) {
                this.value = start
        }

        inc() {
                this.value = this.value + 1
        }

        show() {
                return this.value
        }
}

let c = new Counter(10)
c.inc()
console.log(c.show())`,
    },
    {
        name: 'Class Rectangle',
        language: 'javascript',
        description: 'OOP: method returning computed value',
        code: `class Rectangle {
        constructor(w, h) {
                this.w = w
                this.h = h
        }

        area() {
                return this.w * this.h
        }
}

let r = new Rectangle(5, 8)
console.log(r.area())`,
    },
    {
        name: 'Class Wallet',
        language: 'javascript',
        description: 'OOP: deposit and spend methods',
        code: `class Wallet {
        constructor(balance) {
                this.balance = balance
        }

        add(amount) {
                this.balance = this.balance + amount
        }

        spend(amount) {
                this.balance = this.balance - amount
        }
}

let w = new Wallet(100)
w.add(25)
w.spend(40)
console.log(w.balance)`,
    },
    {
        name: 'Class GradeBook',
        language: 'javascript',
        description: 'OOP with conditional method',
        code: `class GradeBook {
        constructor(score) {
                this.score = score
        }

        grade() {
                if (this.score >= 90) return "A"
                if (this.score >= 75) return "B"
                return "C"
        }
}

let g = new GradeBook(82)
console.log(g.grade())`,
    },
    {
        name: 'Class Distance',
        language: 'javascript',
        description: 'OOP using Math-like logic',
        code: `class Distance {
        constructor(a, b) {
                this.a = a
                this.b = b
        }

        diff() {
                if (this.a > this.b) {
                        return this.a - this.b
                }
                return this.b - this.a
        }
}

let d = new Distance(9, 25)
console.log(d.diff())`,
    },
    {
        name: 'Class Tracker with Loop',
        language: 'javascript',
        description: 'OOP object updated inside loop',
        code: `class Tracker {
        constructor() {
                this.total = 0
        }

        add(v) {
                this.total = this.total + v
        }
}

let t = new Tracker()
for (let i = 1; i <= 4; i++) {
        t.add(i)
}
console.log(t.total)`,
    },
    {
        name: 'Class Method Chain Style',
        language: 'javascript',
        description: 'Sequential method calls on object',
        code: `class Box {
        constructor(value) {
                this.value = value
        }

        double() {
                this.value = this.value * 2
        }

        minusOne() {
                this.value = this.value - 1
        }
}

let b = new Box(3)
b.double()
b.minusOne()
console.log(b.value)`,
    },

    // ═══════════════════════════════════
    // JAVA EXAMPLES
    // ═══════════════════════════════════
    {
        name: 'Java Variables',
        language: 'java',
        description: 'Primitive variables in Java style',
        code: `int a = 10;
int b = 20;
int sum = a + b;
System.out.println(sum);`,
    },
    {
        name: 'Java If Else',
        language: 'java',
        description: 'Conditional branching',
        code: `int score = 78;
if (score >= 80) {
        System.out.println("A");
} else {
        System.out.println("B");
}`,
    },
    {
        name: 'Java Nested If',
        language: 'java',
        description: 'Nested condition checks',
        code: `int n = 15;
if (n > 0) {
        if (n > 10) {
                System.out.println("big");
        } else {
                System.out.println("small");
        }
}`,
    },
    {
        name: 'Java For Loop',
        language: 'java',
        description: 'Sum with for loop',
        code: `int total = 0;
for (int i = 1; i <= 5; i++) {
        total = total + i;
}
System.out.println(total);`,
    },
    {
        name: 'Java While Loop',
        language: 'java',
        description: 'Countdown loop',
        code: `int n = 5;
while (n > 0) {
        System.out.println(n);
        n = n - 1;
}`,
    },
    {
        name: 'Java Nested Loops',
        language: 'java',
        description: 'Multiplication table',
        code: `for (int i = 1; i <= 3; i++) {
        for (int j = 1; j <= 3; j++) {
                System.out.println(i * j);
        }
}`,
    },
    {
        name: 'Java Array Basics',
        language: 'java',
        description: 'Array declaration and indexing',
        code: `int[] arr = [4, 8, 1, 6];
System.out.println(arr[0]);
arr[2] = 10;
System.out.println(arr[2]);`,
    },
    {
        name: 'Java Array Sum',
        language: 'java',
        description: 'Compute array sum',
        code: `int[] arr = [2, 4, 6, 8];
int s = 0;
for (int i = 0; i < 4; i++) {
        s = s + arr[i];
}
System.out.println(s);`,
    },
    {
        name: 'Java Matrix Update',
        language: 'java',
        description: '2D array row reference update',
        code: `int[] row1 = [1, 2, 3];
int[] row2 = [4, 5, 6];
int[] row3 = [7, 8, 9];
int[] matrix = [row1, row2, row3];

int[] targetRow = matrix[1];
targetRow[2] = 42;
System.out.println(matrix);`,
    },
    {
        name: 'Java Function Add',
        language: 'java',
        description: 'Top-level function style',
        code: `int add(int a, int b) {
        return a + b;
}
int x = add(7, 5);
System.out.println(x);`,
    },
    {
        name: 'Java Recursive Factorial',
        language: 'java',
        description: 'Recursion example',
        code: `int fact(int n) {
        if (n <= 1) {
                return 1;
        }
        return n * fact(n - 1);
}
System.out.println(fact(5));`,
    },
    {
        name: 'Java Fibonacci',
        language: 'java',
        description: 'Recursive fibonacci',
        code: `int fib(int n) {
        if (n <= 1) return n;
        return fib(n - 1) + fib(n - 2);
}
System.out.println(fib(7));`,
    },
    {
        name: 'Java Bubble Sort',
        language: 'java',
        description: 'Sorting with swaps',
        code: `int[] arr = [5, 3, 8, 1, 2];
for (int i = 0; i < 5; i++) {
        for (int j = 0; j < 4; j++) {
                if (arr[j] > arr[j + 1]) {
                        int t = arr[j];
                        arr[j] = arr[j + 1];
                        arr[j + 1] = t;
                }
        }
}
System.out.println(arr);`,
    },
    {
        name: 'Java Linear Search',
        language: 'java',
        description: 'Find index in array',
        code: `int[] arr = [9, 4, 7, 1, 6];
int pos = -1;
for (int i = 0; i < 5; i++) {
        if (arr[i] == 7) {
                pos = i;
        }
}
System.out.println(pos);`,
    },
    {
        name: 'Java Max in Array',
        language: 'java',
        description: 'Track maximum value',
        code: `int[] arr = [15, 3, 28, 11, 7];
int m = arr[0];
for (int i = 1; i < 5; i++) {
        if (arr[i] > m) m = arr[i];
}
System.out.println(m);`,
    },
    {
        name: 'Java GCD Loop',
        language: 'java',
        description: 'Euclid algorithm',
        code: `int a = 48;
int b = 18;
while (b != 0) {
        int t = b;
        b = a % b;
        a = t;
}
System.out.println(a);`,
    },
    {
        name: 'Java Even Odd',
        language: 'java',
        description: 'Parity check',
        code: `int n = 37;
if (n % 2 == 0) {
        System.out.println("even");
} else {
        System.out.println("odd");
}`,
    },
    {
        name: 'Java Prime Flag',
        language: 'java',
        description: 'Prime detection',
        code: `int n = 19;
int ok = 1;
for (int i = 2; i < n; i++) {
        if (n % i == 0) {
                ok = 0;
        }
}
System.out.println(ok);`,
    },
    {
        name: 'Java Reverse Number',
        language: 'java',
        description: 'Digit reverse logic',
        code: `int n = 1234;
int rev = 0;
while (n > 0) {
        rev = rev * 10 + (n % 10);
        n = n / 10;
}
System.out.println(rev);`,
    },
    {
        name: 'Java Count Digits',
        language: 'java',
        description: 'Count number digits',
        code: `int n = 98765;
int c = 0;
while (n > 0) {
        c = c + 1;
        n = n / 10;
}
System.out.println(c);`,
    },
    {
        name: 'Java Sum of Digits',
        language: 'java',
        description: 'Accumulate digits',
        code: `int n = 1234;
int s = 0;
while (n > 0) {
        s = s + (n % 10);
        n = n / 10;
}
System.out.println(s);`,
    },
    {
        name: 'Java Class Counter',
        language: 'java',
        description: 'OOP: mutable class state',
        code: `class Counter {
        int value;
        Counter(int start) {
                this.value = start;
        }
        void inc() {
                this.value = this.value + 1;
        }
}
Counter c = new Counter(3);
c.inc();
System.out.println(c.value);`,
    },
    {
        name: 'Java Class Rectangle',
        language: 'java',
        description: 'OOP: area method',
        code: `class Rectangle {
        int w;
        int h;
        Rectangle(int w, int h) {
                this.w = w;
                this.h = h;
        }
        int area() {
                return this.w * this.h;
        }
}
Rectangle r = new Rectangle(4, 6);
System.out.println(r.area());`,
    },
    {
        name: 'Java Class Account',
        language: 'java',
        description: 'OOP: deposit and withdraw',
        code: `class Account {
        int balance;
        Account(int b) {
                this.balance = b;
        }
        void deposit(int x) {
                this.balance = this.balance + x;
        }
        void withdraw(int x) {
                this.balance = this.balance - x;
        }
}
Account a = new Account(100);
a.deposit(20);
a.withdraw(15);
System.out.println(a.balance);`,
    },
    {
        name: 'Java Class Student',
        language: 'java',
        description: 'OOP: grade computation',
        code: `class Student {
        int marks;
        Student(int m) {
                this.marks = m;
        }
        int grade() {
                if (this.marks >= 80) return 1;
                if (this.marks >= 60) return 2;
                return 3;
        }
}
Student s = new Student(72);
System.out.println(s.grade());`,
    },
    {
        name: 'Java Class Distance',
        language: 'java',
        description: 'OOP: absolute difference',
        code: `class Distance {
        int a;
        int b;
        Distance(int a, int b) {
                this.a = a;
                this.b = b;
        }
        int diff() {
                if (this.a > this.b) return this.a - this.b;
                return this.b - this.a;
        }
}
Distance d = new Distance(5, 19);
System.out.println(d.diff());`,
    },
    {
        name: 'Java Class Tracker Loop',
        language: 'java',
        description: 'OOP in loops',
        code: `class Tracker {
        int total;
        Tracker() {
                this.total = 0;
        }
        void add(int v) {
                this.total = this.total + v;
        }
}
Tracker t = new Tracker();
for (int i = 1; i <= 4; i++) {
        t.add(i);
}
System.out.println(t.total);`,
    },
    {
        name: 'Java Class Box Chain',
        language: 'java',
        description: 'OOP: multiple method calls',
        code: `class Box {
        int value;
        Box(int v) {
                this.value = v;
        }
        void doubleIt() {
                this.value = this.value * 2;
        }
        void minusOne() {
                this.value = this.value - 1;
        }
}
Box b = new Box(3);
b.doubleIt();
b.minusOne();
System.out.println(b.value);`,
    },
    {
        name: 'Java Class Two Objects',
        language: 'java',
        description: 'OOP: independent instances',
        code: `class Lamp {
        int state;
        Lamp(int s) {
                this.state = s;
        }
        void toggle() {
                this.state = 1 - this.state;
        }
}
Lamp a = new Lamp(0);
Lamp b = new Lamp(1);
a.toggle();
System.out.println(a.state);
System.out.println(b.state);`,
    },
    {
        name: 'Java Class Return Method',
        language: 'java',
        description: 'OOP: return from method',
        code: `class MathBox {
        int x;
        MathBox(int x) {
                this.x = x;
        }
        int square() {
                return this.x * this.x;
        }
}
MathBox m = new MathBox(9);
System.out.println(m.square());`,
    },
    {
        name: 'Java Class Array Worker',
        language: 'java',
        description: 'OOP worker with constructor and method',
        code: `class Worker {
        int value;
        Worker(int v) {
            this.value = v;
        }
        int apply(int x) {
            return x + this.value;
        }
}
    Worker w = new Worker(5);
    System.out.println(w.apply(7));`,
    },

    // ═══════════════════════════════════
    // .NET (C#) EXAMPLES
    // ═══════════════════════════════════
    {
        name: '.NET Variables',
        language: 'dotnet',
        description: 'Basic typed variables',
        code: `int a = 12;
int b = 7;
int c = a + b;
Console.WriteLine(c);`,
    },
    {
        name: '.NET If Else',
        language: 'dotnet',
        description: 'Conditional logic',
        code: `int x = 20;
if (x > 10) {
        Console.WriteLine("high");
} else {
        Console.WriteLine("low");
}`,
    },
    {
        name: '.NET For Loop',
        language: 'dotnet',
        description: 'Accumulate totals',
        code: `int total = 0;
for (int i = 1; i <= 5; i++) {
        total += i;
}
Console.WriteLine(total);`,
    },
    {
        name: '.NET While Loop',
        language: 'dotnet',
        description: 'Loop with decrement',
        code: `int n = 4;
while (n > 0) {
        Console.WriteLine(n);
        n--;
}`,
    },
    {
        name: '.NET Nested Loops',
        language: 'dotnet',
        description: 'Nested iteration',
        code: `for (int i = 1; i <= 3; i++) {
        for (int j = 1; j <= 3; j++) {
                Console.WriteLine(i * j);
        }
}`,
    },
    {
        name: '.NET Array Basics',
        language: 'dotnet',
        description: 'Array read and write',
        code: `int[] arr = [5, 6, 7, 8];
Console.WriteLine(arr[1]);
arr[1] = 12;
Console.WriteLine(arr[1]);`,
    },
    {
        name: '.NET Array Sum',
        language: 'dotnet',
        description: 'Sum array values',
        code: `int[] arr = [1, 3, 5, 7];
int s = 0;
for (int i = 0; i < 4; i++) {
        s = s + arr[i];
}
Console.WriteLine(s);`,
    },
    {
        name: '.NET Matrix Update',
        language: 'dotnet',
        description: '2D array row reference update',
        code: `int[] row1 = [1, 2, 3];
int[] row2 = [4, 5, 6];
int[] row3 = [7, 8, 9];
int[] matrix = [row1, row2, row3];

int[] targetRow = matrix[1];
targetRow[2] = 42;
Console.WriteLine(matrix);`,
    },
    {
        name: '.NET Function Multiply',
        language: 'dotnet',
        description: 'Function return value',
        code: `int multiply(int a, int b) {
        return a * b;
}
int p = multiply(4, 6);
Console.WriteLine(p);`,
    },
    {
        name: '.NET Factorial Recursion',
        language: 'dotnet',
        description: 'Recursive factorial',
        code: `int fact(int n) {
        if (n <= 1) return 1;
        return n * fact(n - 1);
}
Console.WriteLine(fact(6));`,
    },
    {
        name: '.NET Fibonacci',
        language: 'dotnet',
        description: 'Recursive fibonacci',
        code: `int fib(int n) {
        if (n <= 1) return n;
        return fib(n - 1) + fib(n - 2);
}
Console.WriteLine(fib(8));`,
    },
    {
        name: '.NET Bubble Sort',
        language: 'dotnet',
        description: 'Sort integer array',
        code: `int[] arr = [9, 2, 6, 1, 3];
for (int i = 0; i < 5; i++) {
        for (int j = 0; j < 4; j++) {
                if (arr[j] > arr[j + 1]) {
                        int t = arr[j];
                        arr[j] = arr[j + 1];
                        arr[j + 1] = t;
                }
        }
}
Console.WriteLine(arr);`,
    },
    {
        name: '.NET Linear Search',
        language: 'dotnet',
        description: 'Locate target index',
        code: `int[] arr = [11, 22, 33, 44, 55];
int pos = -1;
for (int i = 0; i < 5; i++) {
        if (arr[i] == 44) pos = i;
}
Console.WriteLine(pos);`,
    },
    {
        name: '.NET Max Value',
        language: 'dotnet',
        description: 'Max element in list',
        code: `int[] arr = [4, 19, 2, 30, 11];
int m = arr[0];
for (int i = 1; i < 5; i++) {
        if (arr[i] > m) m = arr[i];
}
Console.WriteLine(m);`,
    },
    {
        name: '.NET GCD While',
        language: 'dotnet',
        description: 'Euclid gcd loop',
        code: `int a = 84;
int b = 30;
while (b != 0) {
        int t = b;
        b = a % b;
        a = t;
}
Console.WriteLine(a);`,
    },
    {
        name: '.NET Reverse Number',
        language: 'dotnet',
        description: 'Reverse integer digits',
        code: `int n = 2468;
int rev = 0;
while (n > 0) {
        rev = rev * 10 + (n % 10);
        n = n / 10;
}
Console.WriteLine(rev);`,
    },
    {
        name: '.NET Count Digits',
        language: 'dotnet',
        description: 'Count digits in number',
        code: `int n = 123456;
int c = 0;
while (n > 0) {
        c++;
        n = n / 10;
}
Console.WriteLine(c);`,
    },
    {
        name: '.NET Sum Digits',
        language: 'dotnet',
        description: 'Digit sum loop',
        code: `int n = 5678;
int s = 0;
while (n > 0) {
        s = s + (n % 10);
        n = n / 10;
}
Console.WriteLine(s);`,
    },
    {
        name: '.NET Prime Check',
        language: 'dotnet',
        description: 'Simple prime test',
        code: `int n = 17;
int ok = 1;
for (int i = 2; i < n; i++) {
        if (n % i == 0) ok = 0;
}
Console.WriteLine(ok);`,
    },
    {
        name: '.NET Power Iterative',
        language: 'dotnet',
        description: 'Compute power in loop',
        code: `int b = 2;
int e = 8;
int ans = 1;
for (int i = 0; i < e; i++) {
        ans = ans * b;
}
Console.WriteLine(ans);`,
    },
    {
        name: '.NET Class Counter',
        language: 'dotnet',
        description: 'OOP: mutable state',
        code: `class Counter {
        int value;
        Counter(int s) {
                this.value = s;
        }
        void Inc() {
                this.value = this.value + 1;
        }
}
Counter c = new Counter(10);
c.Inc();
Console.WriteLine(c.value);`,
    },
    {
        name: '.NET Class Rectangle',
        language: 'dotnet',
        description: 'OOP: area method',
        code: `class Rectangle {
        int w;
        int h;
        Rectangle(int w, int h) {
                this.w = w;
                this.h = h;
        }
        int Area() {
                return this.w * this.h;
        }
}
Rectangle r = new Rectangle(5, 9);
Console.WriteLine(r.Area());`,
    },
    {
        name: '.NET Class Wallet',
        language: 'dotnet',
        description: 'OOP: add/spend methods',
        code: `class Wallet {
        int balance;
        Wallet(int b) {
                this.balance = b;
        }
        void Add(int x) {
                this.balance = this.balance + x;
        }
        void Spend(int x) {
                this.balance = this.balance - x;
        }
}
Wallet w = new Wallet(200);
w.Add(30);
w.Spend(50);
Console.WriteLine(w.balance);`,
    },
    {
        name: '.NET Class GradeBook',
        language: 'dotnet',
        description: 'OOP: conditional return',
        code: `class GradeBook {
        int score;
        GradeBook(int s) {
                this.score = s;
        }
        int Grade() {
                if (this.score >= 90) return 1;
                if (this.score >= 75) return 2;
                return 3;
        }
}
GradeBook g = new GradeBook(82);
Console.WriteLine(g.Grade());`,
    },
    {
        name: '.NET Class Distance',
        language: 'dotnet',
        description: 'OOP: difference logic',
        code: `class Distance {
        int a;
        int b;
        Distance(int a, int b) {
                this.a = a;
                this.b = b;
        }
        int Diff() {
                if (this.a > this.b) return this.a - this.b;
                return this.b - this.a;
        }
}
Distance d = new Distance(3, 14);
Console.WriteLine(d.Diff());`,
    },
    {
        name: '.NET Class Tracker Loop',
        language: 'dotnet',
        description: 'OOP object updated in loop',
        code: `class Tracker {
        int total;
        Tracker() {
                this.total = 0;
        }
        void Add(int v) {
                this.total = this.total + v;
        }
}
Tracker t = new Tracker();
for (int i = 1; i <= 5; i++) {
        t.Add(i);
}
Console.WriteLine(t.total);`,
    },
    {
        name: '.NET Class Box Chain',
        language: 'dotnet',
        description: 'OOP chained updates',
        code: `class Box {
        int value;
        Box(int v) {
                this.value = v;
        }
        void Double() {
                this.value = this.value * 2;
        }
        void Minus() {
                this.value = this.value - 1;
        }
}
Box b = new Box(4);
b.Double();
b.Minus();
Console.WriteLine(b.value);`,
    },
    {
        name: '.NET Class Lamp Toggle',
        language: 'dotnet',
        description: 'OOP toggle behavior',
        code: `class Lamp {
        int state;
        Lamp(int s) {
                this.state = s;
        }
        void Toggle() {
                this.state = 1 - this.state;
        }
}
Lamp l = new Lamp(0);
l.Toggle();
Console.WriteLine(l.state);`,
    },
    {
        name: '.NET Class MathBox',
        language: 'dotnet',
        description: 'OOP return computation',
        code: `class MathBox {
        int x;
        MathBox(int x) {
                this.x = x;
        }
        int Square() {
                return this.x * this.x;
        }
}
MathBox m = new MathBox(11);
Console.WriteLine(m.Square());`,
    },
    {
        name: '.NET Class Pair Sum',
        language: 'dotnet',
        description: 'OOP with two fields',
        code: `class Pair {
        int a;
        int b;
        Pair(int a, int b) {
                this.a = a;
                this.b = b;
        }
        int Sum() {
                return this.a + this.b;
        }
}
Pair p = new Pair(9, 13);
Console.WriteLine(p.Sum());`,
    },
    {
        name: '.NET Class Two Objects',
        language: 'dotnet',
        description: 'Independent object states',
        code: `class Meter {
        int value;
        Meter(int v) {
                this.value = v;
        }
        void Add(int x) {
                this.value = this.value + x;
        }
}
Meter m1 = new Meter(1);
Meter m2 = new Meter(10);
m1.Add(2);
Console.WriteLine(m1.value);
Console.WriteLine(m2.value);`,
    },
    {
        name: '.NET Class Array Processor',
        language: 'dotnet',
        description: 'OOP processor with constructor and method',
        code: `class Processor {
        int value;
        Processor(int v) {
            this.value = v;
        }
        int Sum4(int x) {
            return x + this.value;
        }
}
    Processor p = new Processor(6);
    Console.WriteLine(p.Sum4(4));`,
    },
    {
        name: '.NET Class Threshold',
        language: 'dotnet',
        description: 'OOP method with branching',
        code: `class Threshold {
        int value;
        Threshold(int v) {
                this.value = v;
        }
        int Check() {
                if (this.value > 50) return 1;
                return 0;
        }
}
Threshold t = new Threshold(42);
Console.WriteLine(t.Check());`,
    },
    // ═══════════════════════════════════
    // PHP EXAMPLES
    // ═══════════════════════════════════
    {
        name: 'PHP Variables',
        language: 'php',
        description: 'Basic variable assignments',
        code: `<?php
$a = 10;
$b = 20;
$sum = $a + $b;
echo($sum);`,
    },
    {
        name: 'PHP If Else',
        language: 'php',
        description: 'Conditional branch',
        code: `<?php
$x = 15;
if ($x > 10) {
    $out = 1;
} else {
    $out = 0;
}
echo($out);`,
    },
    {
        name: 'PHP Nested If',
        language: 'php',
        description: 'Nested conditions',
        code: `<?php
$n = 7;
if ($n > 0) {
    if ($n % 2 == 0) {
        $tag = 2;
    } else {
        $tag = 1;
    }
}
echo($tag);`,
    },
    {
        name: 'PHP For Loop',
        language: 'php',
        description: 'For loop total',
        code: `<?php
$total = 0;
for ($i = 1; $i <= 5; $i++) {
    $total = $total + $i;
}
echo($total);`,
    },
    {
        name: 'PHP While Loop',
        language: 'php',
        description: 'While loop count',
        code: `<?php
$i = 1;
$total = 0;
while ($i <= 5) {
    $total = $total + $i;
    $i = $i + 1;
}
echo($total);`,
    },
    {
        name: 'PHP Nested Loops',
        language: 'php',
        description: 'Nested loop accumulation',
        code: `<?php
$count = 0;
for ($r = 1; $r <= 3; $r++) {
    for ($c = 1; $c <= 3; $c++) {
        $count = $count + 1;
    }
}
echo($count);`,
    },
    {
        name: 'PHP Array Index',
        language: 'php',
        description: 'Read array values',
        code: `<?php
$arr = [4, 6, 8, 10];
$v = $arr[2];
echo($v);`,
    },
    {
        name: 'PHP Array Sum',
        language: 'php',
        description: 'Sum array using loop',
        code: `<?php
$arr = [1, 3, 5, 7];
$s = 0;
for ($i = 0; $i < 4; $i++) {
    $s = $s + $arr[$i];
}
echo($s);`,
    },
    {
        name: 'PHP Running Sum Array',
        language: 'php',
        description: 'Prefix sum update',
        code: `<?php
$arr = [1, 2, 3, 4, 5];
for ($i = 1; $i < 5; $i++) {
    $arr[$i] = $arr[$i] + $arr[$i - 1];
}
echo($arr);`,
    },
    {
        name: 'PHP Matrix Update',
        language: 'php',
        description: '2D array cell updates',
        code: `<?php
$m = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
];
$m[1][1] = 42;
$v = $m[1][1];
$v = $v + 1;
echo($v);
echo($m);`,
    },
    {
        name: 'PHP Matrix Traverse',
        language: 'php',
        description: '2D array row traversal and update',
        code: `<?php
$m = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
];
$row = $m[1];
$row[2] = 42;
echo($row);
echo($m);`,
    },
    {
        name: 'PHP Function Add',
        language: 'php',
        description: 'Simple function call',
        code: `<?php
function add($a, $b) {
    return $a + $b;
}
$ans = add(3, 9);
echo($ans);`,
    },
    {
        name: 'PHP Function Multiply',
        language: 'php',
        description: 'Function multiply',
        code: `<?php
function mul($a, $b) {
    return $a * $b;
}
$p = mul(4, 6);
echo($p);`,
    },
    {
        name: 'PHP Recursive Factorial',
        language: 'php',
        description: 'Recursion example',
        code: `<?php
function fact($n) {
    if ($n <= 1) {
        return 1;
    }
    return $n * fact($n - 1);
}
echo(fact(5));`,
    },
    {
        name: 'PHP Recursive Fibonacci',
        language: 'php',
        description: 'Recursive fibonacci',
        code: `<?php
function fib($n) {
    if ($n <= 1) {
        return $n;
    }
    return fib($n - 1) + fib($n - 2);
}
echo(fib(7));`,
    },
    {
        name: 'PHP Linear Search',
        language: 'php',
        description: 'Find target index',
        code: `<?php
$arr = [10, 25, 30, 45, 60];
$pos = -1;
for ($i = 0; $i < 5; $i++) {
    if ($arr[$i] == 30) {
        $pos = $i;
    }
}
echo($pos);`,
    },
    {
        name: 'PHP Bubble Sort',
        language: 'php',
        description: 'Bubble sort logic',
        code: `<?php
$arr = [5, 3, 8, 1, 2];
$n = 5;
for ($i = 0; $i < $n; $i++) {
    for ($j = 0; $j < $n - 1; $j++) {
        if ($arr[$j] > $arr[$j + 1]) {
            $t = $arr[$j];
            $arr[$j] = $arr[$j + 1];
            $arr[$j + 1] = $t;
        }
    }
}
echo($arr);`,
    },
    {
        name: 'PHP Selection Sort',
        language: 'php',
        description: 'Selection sort logic',
        code: `<?php
$arr = [64, 25, 12, 22, 11];
$n = 5;
for ($i = 0; $i < $n; $i++) {
    $mi = $i;
    for ($j = $i + 1; $j < $n; $j++) {
        if ($arr[$j] < $arr[$mi]) {
            $mi = $j;
        }
    }
    $t = $arr[$i];
    $arr[$i] = $arr[$mi];
    $arr[$mi] = $t;
}
echo($arr);`,
    },
    {
        name: 'PHP GCD Euclid',
        language: 'php',
        description: 'Greatest common divisor',
        code: `<?php
function gcd($a, $b) {
    if ($b == 0) {
        return $a;
    }
    return gcd($b, $a % $b);
}
echo(gcd(48, 18));`,
    },
    {
        name: 'PHP Power Recursion',
        language: 'php',
        description: 'Power function',
        code: `<?php
function power($b, $e) {
    if ($e == 0) {
        return 1;
    }
    return $b * power($b, $e - 1);
}
echo(power(2, 8));`,
    },
    {
        name: 'PHP Reverse Number',
        language: 'php',
        description: 'Reverse digits',
        code: `<?php
$n = 12345;
$rev = 0;
while ($n > 0) {
    $rev = $rev * 10 + ($n % 10);
    $n = ($n - ($n % 10)) / 10;
}
echo($rev);`,
    },
    {
        name: 'PHP Count Digits',
        language: 'php',
        description: 'Count digits loop',
        code: `<?php
$n = 54321;
$c = 0;
while ($n > 0) {
    $n = ($n - ($n % 10)) / 10;
    $c = $c + 1;
}
echo($c);`,
    },
    {
        name: 'PHP Sum Digits',
        language: 'php',
        description: 'Sum all digits',
        code: `<?php
$n = 5678;
$s = 0;
while ($n > 0) {
    $s = $s + ($n % 10);
    $n = ($n - ($n % 10)) / 10;
}
echo($s);`,
    },
    {
        name: 'PHP Even Odd',
        language: 'php',
        description: 'Parity check',
        code: `<?php
$n = 42;
if ($n % 2 == 0) {
    $v = 1;
} else {
    $v = 0;
}
echo($v);`,
    },
    {
        name: 'PHP Prime Check',
        language: 'php',
        description: 'Simple prime test',
        code: `<?php
$n = 17;
$ok = 1;
for ($i = 2; $i < $n; $i++) {
    if ($n % $i == 0) {
        $ok = 0;
    }
}
echo($ok);`,
    },
    {
        name: 'PHP Max In Array',
        language: 'php',
        description: 'Track maximum value',
        code: `<?php
$arr = [8, 3, 11, 2, 6];
$m = $arr[0];
for ($i = 1; $i < 5; $i++) {
    if ($arr[$i] > $m) {
        $m = $arr[$i];
    }
}
echo($m);`,
    },
    {
        name: 'PHP Min In Array',
        language: 'php',
        description: 'Track minimum value',
        code: `<?php
$arr = [8, 3, 11, 2, 6];
$m = $arr[0];
for ($i = 1; $i < 5; $i++) {
    if ($arr[$i] < $m) {
        $m = $arr[$i];
    }
}
echo($m);`,
    },
    {
        name: 'PHP Absolute Difference',
        language: 'php',
        description: 'Absolute-like diff using branch',
        code: `<?php
$a = 13;
$b = 28;
if ($a > $b) {
    $d = $a - $b;
} else {
    $d = $b - $a;
}
echo($d);`,
    },
    {
        name: 'PHP Range Sum',
        language: 'php',
        description: 'Summation 1..n',
        code: `<?php
$n = 10;
$total = 0;
for ($i = 1; $i <= $n; $i++) {
    $total = $total + $i;
}
echo($total);`,
    },
    {
        name: 'PHP Function Composition',
        language: 'php',
        description: 'Call function inside function',
        code: `<?php
function twice($x) {
    return $x * 2;
}
function plusThree($x) {
    return $x + 3;
}
$v = plusThree(twice(5));
echo($v);`,
    },
    {
        name: 'PHP Countdown',
        language: 'php',
        description: 'Decrement while loop',
        code: `<?php
$n = 5;
$last = 0;
while ($n > 0) {
    $last = $n;
    $n = $n - 1;
}
echo($last);`,
    },
];
