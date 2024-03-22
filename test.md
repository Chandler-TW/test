::: {#site-wrapper}
::: {#site-header-main}
::: {#site-header-main-inside}
[]{#nav-cancel}

<div>

-   [Navigate]{#menu-item-9876}
    -   [[16.3 --- std::vector and the unsigned length and subscript
        problem](https://www.learncpp.com/cpp-tutorial/stdvector-and-the-unsigned-length-and-subscript-problem/)]{#menu-item-1009876}
    -   [Table of contents](https://www.learncpp.com/)
    -   [16.1 --- Introduction to containers and
        arrays](https://www.learncpp.com/cpp-tutorial/introduction-to-containers-and-arrays/)
-   [[Site
    Index](https://www.learncpp.com/learn-cpp-site-index/)]{#menu-item-6312}
-   [[Latest
    Changes](https://www.learncpp.com/latest-changes/)]{#menu-item-12722}
-   [[About](https://www.learncpp.com/about/)]{#menu-item-6313}
    -   [[Site
        FAQ](https://www.learncpp.com/cpp-tutorial/introduction-to-these-tutorials#FAQ)]{#menu-item-11705}
    -   [[Leave
        feedback](https://www.learncpp.com/leave-feedback-report-issue/)]{#menu-item-12083}
    -   [[Report an
        issue](https://www.learncpp.com/leave-feedback-report-issue/)]{#menu-item-11706}
    -   [[Contact /
        Support](https://www.learncpp.com/about/)]{#menu-item-11707}
    -   [[Donate](https://www.learncpp.com/about/)]{#menu-item-16006}
-   [[ ](https://darkreader.org/ "LearnCPP doesn’t have a native dark mode, but this link will take you to a browser plugin that will let you make any web page dark.")]{#menu-item-12082}
-   [[Search]{.screen-reader-text}](https://www.learncpp.com/cpp-tutorial/introduction-to-stdvector-and-list-constructors/)
    [Search for:]{.screen-reader-text}
    [Search]{.screen-reader-text}

</div>

::: {#branding}
::: {.identity}
[![Learn
C++](https://www.learncpp.com/blog/wp-content/uploads/learncpp.png){.custom-logo}](https://www.learncpp.com/ "Learn C++"){#logo
.custom-logo-link}
:::

::: {#site-text}
::: {#site-title itemprop="headline"}
 [Learn
C++](https://www.learncpp.com/ "Skill up with our free tutorials")
:::

[Skill up with our free tutorials]{#site-description
itemprop="description"}
:::
:::

[]{#nav-toggle}

::: {.skip-link .screen-reader-text}
[Skip to
content](https://www.learncpp.com/cpp-tutorial/introduction-to-stdvector-and-list-constructors/#main "Skip to content")
:::

<div>

-   Navigate
    -   [16.3 --- std::vector and the unsigned length and subscript
        problem](https://www.learncpp.com/cpp-tutorial/stdvector-and-the-unsigned-length-and-subscript-problem/)
    -   [Table of contents](https://www.learncpp.com/)
    -   [16.1 --- Introduction to containers and
        arrays](https://www.learncpp.com/cpp-tutorial/introduction-to-containers-and-arrays/)
-   [Site Index](https://www.learncpp.com/learn-cpp-site-index/)
-   [Latest Changes](https://www.learncpp.com/latest-changes/)
-   [About](https://www.learncpp.com/about/)
    -   [Site
        FAQ](https://www.learncpp.com/cpp-tutorial/introduction-to-these-tutorials#FAQ)
    -   [Leave
        feedback](https://www.learncpp.com/leave-feedback-report-issue/)
    -   [Report an
        issue](https://www.learncpp.com/leave-feedback-report-issue/)
    -   [Contact / Support](https://www.learncpp.com/about/)
    -   [Donate](https://www.learncpp.com/about/)
-   [ ](https://darkreader.org/ "LearnCPP doesn’t have a native dark mode, but this link will take you to a browser plugin that will let you make any web page dark.")
-   [[Search]{.screen-reader-text}](https://www.learncpp.com/cpp-tutorial/introduction-to-stdvector-and-list-constructors/)
    [Search for:]{.screen-reader-text}
    [Search]{.screen-reader-text}

</div>
:::
:::

::: {#header-image-main}
::: {#header-image-main-inside}
::: {.header-image style="background-image: url(https://www.learncpp.com/blog/wp-content/uploads/stripe.jpg)"}
:::

![16.2 --- Introduction to std::vector and list
constructors](https://www.learncpp.com/blog/wp-content/uploads/stripe.jpg){.header-image}
:::
:::

::: {#content .cryout}
::: {#container .three-columns-sided}
::: {#main .main role="main"}
::: {.schema-image}
:::

::: {.article-inner}
::: {.entry-meta .beforetitle-meta}
:::

16.2 --- Introduction to std::vector and list constructors {#introduction-to-stdvector-and-list-constructors .entry-title .singular-title itemprop="headline"}
==========================================================

::: {.entry-meta .aftertitle-meta}
[
[*Alex*](https://www.learncpp.com/author/Alex/ "View all posts by Alex"){.url
.fn .n} ]{.author .vcard itemscope=""
itemtype="http://schema.org/Person" itemprop="author"} [ September 28,
2015, 4:34 pm December 28, 2023 ]{.onDate .date}
:::

::: {.entry-content itemprop="articleBody"}
::: {.code-block .code-block-1 style="margin: 8px 8px 8px 0; float: left;"}
::: {.cf_monitor style="margin-right: 16px;"}
::: {#ezoic-pub-ad-placeholder-101}
:::

[]{.underline}
:::
:::

In the previous lesson [16.1 \-- Introduction to containers and
arrays](https://www.learncpp.com/cpp-tutorial/introduction-to-containers-and-arrays/),
we introduced both containers and arrays. In this lesson, we'll
introduce the array type that we'll be focused on for the rest of the
chapter: `std::vector`. We'll also solve one part of the scalability
challenge we introduced last lesson.

Introduction to `std::vector`

`std::vector` is one of the container classes in the C++ standard
containers library that implements an array. `std::vector` is defined in
the \<vector\> header as a class template, with a template type
parameter that defines the type of the elements. Thus,
`std::vector<int>` declares a `std::vector` whose elements are of type
`int`.

Instantiating a `std::vector` object is straightforward:

``` {.language-cpp .line-numbers}
#include <vector>

int main()
{
    // Value initialization (uses default constructor)
    std::vector<int> empty{}; // vector containing 0 int elements

    return 0;
}
```

Variable `empty` is defined as a `std::vector` whose elements have type
`int`. Because we've used value initialization here, our vector will
start empty (that is, with no elements).

A vector with no elements may not seem useful now, but we'll encounter
this again in future lessons (particularly [16.11 \-- std::vector and
stack
behavior](https://www.learncpp.com/cpp-tutorial/stdvector-and-stack-behavior/)).

::: {.code-block .code-block-2 style="margin: 8px 0; clear: both;"}
::: {.cf_monitor}
::: {#ezoic-pub-ad-placeholder-130}
:::
:::
:::

Initializing a `std::vector` with a list of values

Since the goal of a container is to manage a set of related values, most
often we will want to initialize our container with those values. We can
do this by using list initialization with the specific initialization
values we want. For example:

``` {.language-cpp .line-numbers}
#include <vector>

int main()
{
    // List construction (uses list constructor)
    std::vector<int> primes{ 2, 3, 5, 7 };          // vector containing 4 int elements with values 2, 3, 5, and 7
    std::vector vowels { 'a', 'e', 'i', 'o', 'u' }; // vector containing 5 char elements with values 'a', 'e', 'i', 'o', and 'u'.  Uses CTAD (C++17) to deduce element type char (preferred).

    return 0;
}
```

With `primes`, we're explicitly specifying that we want a `std::vector`
whose elements have type `int`. Because we've supplied 4 initialization
values, `primes` will contain 4 elements whose values are `2`, `3`, `5`,
and `7`.

With `vowels`, we haven't explicitly specified an element type. Instead,
we're using C++17's CTAD (class template argument deduction) to have the
compiler deduce the element type from the initializers. Because we've
supplied 5 initialization values, `vowels` will contain 5 elements whose
values are `'a'`, `'e'`, `'i'`, `'o'`, and `'u'`.

List constructors and initializer lists

::: {.code-block .code-block-3 style="margin: 8px 0; clear: both;"}
::: {.cf_monitor}
::: {#ezoic-pub-ad-placeholder-108}
:::
:::
:::

Let's talk about how the above works in a little more detail.

In lesson [13.6 \-- Struct aggregate
initialization](https://www.learncpp.com/cpp-tutorial/struct-aggregate-initialization/),
we defined an initializer list as a braced list of comma-separated
values (e.g. `{ 1, 2, 3 }`).

Containers typically have a special constructor called a **list
constructor** that allows us to construct an instance of the container
using an initializer list. The list constructor does three things:

-   Ensures the container has enough storage to hold all the
    initialization values (if needed).
-   Sets the length of the container to the number of elements in the
    initializer list (if needed).
-   Initializes the elements to the values in the initializer list (in
    sequential order).

Thus, when we provide a container with an initializer list of values,
the list constructor is called, and the container is constructed using
that list of values!

::: {.cpp-note .cpp-lightgreenbackground}
Best practice

Use list initialization with an initializer list of values to construct
a container with those element values.
:::

::: {.cpp-note .cpp-lightgraybackground}
Related content

We discuss adding list constructors to your own program-defined classes
in lesson [23.7 \--
std::initializer\_list](https://www.learncpp.com/cpp-tutorial/stdinitializer_list/).
:::

Accessing array elements using the subscript operator (operator\[\])

::: {.code-block .code-block-4 style="margin: 8px 0; clear: both;"}
::: {.cf_monitor}
::: {#ezoic-pub-ad-placeholder-124}
:::
:::
:::

So now that we've created an array of elements... how do we access them?

Let's use an analogy for a moment. Consider a set of identical
mailboxes, side by side. To make it easier to identify the mailboxes,
each mailbox has a number painted on the front. The first mailbox has
number 0, the second has number 1, etc... So if you were told to put
something in mailbox number 0, you'd know that meant the first mailbox.

In C++, the most common way to access array elements is by using the
name of the array along with the subscript operator (`operator[]`). To
select a specific element, inside the square brackets of the subscript
operator, we provide an integral value that identifies which element we
want to select. This integral value is called a **subscript** (or
informally, an **index**). Much like our mailboxes, the first element is
accessed using index 0, the second is accessed using index 1, etc...

For example, `primes[0]` will return the element with index `0` (the
first element) from the `prime` array. The subscript operator returns a
reference to the actual element, not a copy. Once we've accessed an
array element, we can use it just like a normal object (e.g. assign a
value to it, output it, etc...)

Because the indexing starts with 0 rather than 1, we say arrays in C++
are **zero-based**. This can be confusing because we're used to counting
objects starting from 1. This also can cause some ambiguity because when
we talk about array element 1, as it may not be clear whether we're
talking about the first array element (with index 0) or the second array
element (with index 1).

::: {.code-block .code-block-5 style="margin: 8px 0; clear: both;"}
::: {.cf_monitor}
::: {#ezoic-pub-ad-placeholder-120}
:::
:::
:::

Here's an example:

``` {.language-cpp .line-numbers}
#include <iostream>
#include <vector>

int main()
{
    std::vector primes { 2, 3, 5, 7, 11 }; // hold the first 5 prime numbers (as int)

    std::cout << "The first prime number is: " << primes[0] << '\n';
    std::cout << "The second prime number is: " << primes[1] << '\n';
    std::cout << "The sum of the first 5 primes is: " << primes[0] + primes[1] + primes[2] + primes[3] + primes[4] << '\n';

    return 0;
}
```

This prints:

    The first prime number is: 2
    The second prime number is: 3
    The sum of the first 5 primes is: 28

By using arrays, we no longer have to define 5 differently-named
variables to hold our 5 prime values. Instead, we can define a single
array (`primes`) with 5 elements, and just change the value of the index
to access different elements!

We'll talk more about `operator[]` and some other methods for accessing
array elements in the next lesson [16.3 \-- std::vector and the unsigned
length and subscript
problem](https://www.learncpp.com/cpp-tutorial/stdvector-and-the-unsigned-length-and-subscript-problem/).

Subscript out of bounds

When indexing an array, the index provided must select a valid element
of the array. That is, for an array of length N, the subscript must be a
value between 0 and N-1 (inclusive).

`operator[]` does not do any kind of **bounds checking**, meaning it
does not check to see whether the index is within the bounds of 0 to N-1
(inclusive). Passing an invalid index to `operator[]` will return in
undefined behavior.

It is fairly easy to remember not to use negative subscripts. It is less
easy to remember that there is no element with index N! The last element
of the array has index N-1, so using index N will cause the compiler to
try to access an element that is one-past the end of the array.

::: {.code-block .code-block-6 style="margin: 8px 0; clear: both;"}
::: {.cf_monitor}
::: {#ezoic-pub-ad-placeholder-125}
:::
:::
:::

::: {.cpp-note .cpp-lightbluebackground}
Tip

In an array with N elements, the first element has index 0, the second
has index 1, and the last element has index N-1. There is no element
with index N!

Using N as a subscript will cause undefined behavior (as this is
actually attempting to access the N+1th element, which isn't part of the
array).
:::

::: {.cpp-note .cpp-lightbluebackground}
Tip

Some compilers (like Visual Studio) provide a runtime assert that the
index is valid. In such cases, if an invalid index is provided in debug
mode, the program will assert out. In release mode, the assert is
compiled out so there is no performance penalty.
:::

Arrays are contiguous in memory

One of the defining characteristics of arrays is that the elements are
always allocated contiguously in memory, meaning the elements are all
adjacent in memory (with no gaps between them).

As an illustration of this:

``` {.language-cpp .line-numbers}
#include <iostream>
#include <vector>

int main()
{
    std::vector primes { 2, 3, 5, 7, 11 }; // hold the first 5 prime numbers (as int)

    std::cout << "An int is " << sizeof(int) << " bytes\n";
    std::cout << &(primes[0]) << '\n';
    std::cout << &(primes[1]) << '\n';
    std::cout << &(primes[2]) << '\n';

    return 0;
}
```

On the author's machine, one run of the above program produced the
following result:

    An int is 4 bytes
    00DBF720
    00DBF724
    00DBF728

You'll note that the memory addresses for these int elements are 4 bytes
apart, the same as the size of an `int` on the author's machine.

::: {.code-block .code-block-7 style="margin: 8px 0; clear: both;"}
::: {.cf_monitor}
::: {#ezoic-pub-ad-placeholder-121}
:::
:::
:::

This means arrays do not have any per-element overhead. It also allows
the compiler to quickly calculate the address of any element in the
array.

::: {.cpp-note .cpp-lightgraybackground}
Related content

We'll talk about the math behind subscripting in lesson [17.9 \--
Pointer arithmetic and
subscripting](https://www.learncpp.com/cpp-tutorial/pointer-arithmetic-and-subscripting/)
:::

Arrays are one of the few container types that allow **random access**,
meaning every element in the container can be accessed directly and with
equal speed, regardless of the number of elements in the container. The
ability to directly access any element quickly is the primary reason
arrays are the container of choice.

Constructing a `std::vector` of a specific length

Consider the case where we want the user to input 10 values that we'll
store in a `std::vector`. In this case, we need a `std::vector` of
length 10 before we have any values to put in the `std::vector`. How do
we address this?

We could create a `std::vector` and initialize it with an initializer
list with 10 placeholder values:

::: {.code-block .code-block-8 style="margin: 8px 0; clear: both;"}
::: {.cf_monitor}
::: {#ezoic-pub-ad-placeholder-126}
:::
:::
:::

``` {.language-cpp .line-numbers}
 std::vector<int> data { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 }; // vector containing 10 int values
```

But that's bad for a lot of reasons. It requires a lot of typing. It's
not easy to see how many initializers there are. And it's not easy to
update if we decide we want a different number of values later.

Fortunately, `std::vector` has an explicit constructor
(`explicit std::vector<T>(int)`) that takes a single int value defining
the length of the `std::vector` to construct:

``` {.language-cpp .line-numbers}
 std::vector<int> data( 10 ); // vector containing 10 int elements, value-initialized to 0
```

Each of the created elements are value-initialized, which for `int` does
zero-initialization (and for class types calls the default constructor).

However, there is one non-obvious thing about using this constructor: it
must be called using direct initialization.

List constructors take precedence over other constructors

To understand why the previous constructor must be called using direct
initialization, consider this definition:

``` {.language-cpp .line-numbers}
 std::vector<int> data{ 10 }; // what does this do?
```

There are two different constructors that match this initialization:

-   `{ 10 }` can be interpreted as an initializer list, and matched with
    the list constructor to construct a vector of length 1 with
    value 10.
-   `{ 10 }` can be interpreted as a single braced initialization value,
    and matched with the `std::vector<T>(int)` constructor to construct
    a vector of length 10 with elements value-initialized to 0.

Normally when a class type definition matches more than one constructor,
the match is considered ambiguous and a compilation error results.
However, C++ has a special rule for this case: A matching list
constructor will be selected over other matching constructors. Without
this rule, a list constructor would result in an ambiguous match with
any constructor that took arguments of a single type.

Since `{ 10 }` can be interpreted as an initializer list and
`std::vector` has a list constructor, the list constructor takes
precedence in this case.

::: {.cpp-note .cpp-lightbluebackground}
Key insight

When constructing a class type object, a matching list constructor is
selected over other matching constructors.
:::

To help clarify what happens in various initialization cases further,
let's look at similar cases using copy, direct, and list initialization:

``` {.language-cpp .line-numbers}
 // Copy init
    std::vector<int> v1 = 10;     // 10 not an initializer list, copy init won't match explicit constructor: compilation error

    // Direct init
    std::vector<int> v2(10);      // 10 not an initializer list, matches explicit single-argument constructor

    // List init
    std::vector<int> v3{ 10 };    // { 10 } interpreted as initializer list, matches list constructor

    // Copy list init
    std::vector<int> v4 = { 10 }; // { 10 } interpreted as initializer list, matches list constructor
    std::vector<int> v5({ 10 });  // { 10 } interpreted as initializer list, matches list constructor
```

In case `v1`, the initialization value of `10` is not an initializer
list, so the list constructor isn't a match. The single-argument
constructor `explicit std::vector<T>(int)` won't match either because
copy initialization won't match explicit constructors. Since no
constructors match, this is a compilation error.

In case `v2`, the initialization value of `10` is not an initializer
list, so the list constructor isn't a match. The single-argument
constructor `explicit std::vector<T>(int)` is a match, so the
single-argument constructor is selected.

In case `v3` (list initialization), `{ 10 }` can be matched with the
list constructor or `explicit std::vector<T>(int)`. The list constructor
takes precedence over other matching constructors and is selected.

In case `v4` (copy list initialization), `{ 10 }` an be matched with the
list constructor (which is a non-explicit constructor, so can be used
with copy initialization). The list constructor is selected.

Case `v5` surprisingly is an alternate syntax for copy list
initialization (not direct initialization), and is the same as `v4`.

This is one of the warts of C++ initialization: `{ 10 }` will match a
list constructor if one exists, or a single-argument constructor if a
list constructor doesn't exist. This means which behavior you get
depends on whether a list constructor exists! You can generally assume
containers have list constructors.

To summarize, list initializers are generally designed to allow us to
initialize a container with a list of element values, and should be used
for that purpose. That is what we want the majority of the time anyway.
Therefore, `{ 10 }` is appropriate if `10` is meant to be an element
value. If `10` is meant to be an argument to a non-list constructor of a
container, use direct initialization.

::: {.cpp-note .cpp-lightgreenbackground}
Best practice

When constructing a container (or any type that has a list constructor)
with initializers that are not element values, use direct
initialization.
:::

::: {.cpp-note .cpp-lightbluebackground}
Tip

When a `std::vector` is a member of a class type, it is not obvious how
to provide a default initializer that sets the length of a `std::vector`
to some initial value:

``` {.language-cpp .line-numbers}
#include <vector>

struct Foo
{
    std::vector<int> v1(8); // compile error: direct initialization not allowed for member default initializers
};
```

When providing a default initializer for a member of a class type:

-   We must use either copy initialization or list initialization.
-   CTAD is not allowed (so we must explicitly specify the element
    type).

The answer is as follows:

``` {.language-cpp .line-numbers}
struct Foo
{
    std::vector<int> v{ std::vector<int>(8) }; // ok 
};
```

This creates a `std::vector` with a capacity of 8, and then uses that as
the initializer for `v`.
:::

Const and constexpr `std::vector`

Objects of type `std::vector` can be made `const`:

``` {.language-cpp .line-numbers}
#include <vector>

int main()
{
    const std::vector<int> prime { 2, 3, 5, 7, 11 }; // prime and its elements cannot be modified

    return 0;
}
```

A `const std::vector` must be initialized, and then cannot be modified.
The elements of such a vector are treated as if they were const.

The elements of a non-const `std::vector` must be non-const. Thus, the
following is not permitted:

``` {.language-cpp .line-numbers}
#include <vector>

int main()
{
    std::vector<const int> prime { 2, 3, 5, 7, 11 };
}
```

One of the biggest downsides of `std::vector` is that it cannot be made
`constexpr`. If you need a `constexpr` array, use `std::array`.

::: {.cpp-note .cpp-lightgraybackground}
Related content

We cover `std::array` in lesson [17.1 \-- Introduction to
std::array](https://www.learncpp.com/cpp-tutorial/introduction-to-stdarray/).
:::

Why is it called a vector?

When people use the term "vector" in conversation, they typically mean a
geometric vector, which is an object with a magnitude and direction. So
how did `std::vector` get its name when it's not a geometric vector?

In the book "From Mathematics to Generic Programming", Alexander
Stepanov wrote, "The name vector in STL was taken from the earlier
programming languages Scheme and Common Lisp. Unfortunately, this was
inconsistent with the much older meaning of the term in mathematics...
this data structure should have been called array. Sadly, if you make a
mistake and violate these principles, the result might stay around for a
long time."

So, basically, `std::vector` is misnamed, but it's too late to change it
now.

Quiz time

Question \#1

Define a `std::vector` using CTAD and initialize it with the first 5
positive square numbers (1, 4, 9, 16, and 25).

[Show Solution](javascript:void(0)){.solution_link_show}

::: {#cpp_solution_id_0 .wpsolution style="display:none"}
``` {.language-cpp .line-numbers}
std::vector squares{ 1, 4, 9, 16, 25 };
```
:::

Question \#2

What's the behavioral difference between these two definitions?

``` {.language-cpp .line-numbers}
std::vector<int> v1 { 5 };
std::vector<int> v2 ( 5 );
```

[Show Solution](javascript:void(0)){.solution_link_show}

::: {#cpp_solution_id_1 .wpsolution style="display:none"}
`v1` invokes the list constructor to define a 1 element vector
containing value `5`.\
`v2` invokes a non-list constructor that defines a 5 element vector
whose elements are value-initialized.
:::

Question \#3

Define a `std::vector` (using an explicit template type argument) to
hold the high temperature (to the nearest tenth of a degree) for each
day of a year (assume 365 days in a year).

[Show Solution](javascript:void(0)){.solution_link_show}

::: {#cpp_solution_id_2 .wpsolution style="display:none"}
``` {.language-cpp .line-numbers}
std::vector<double> temperature (365); // create a vector to hold 365 double values
```
:::

Question \#4

Using a `std::vector`, write a program that asks the user to enter 3
integral values. Print the sum and product of those values.

The output should match the following:

    Enter 3 integers: 3 4 5
    The sum is: 12
    The product is: 60

[Show Solution](javascript:void(0)){.solution_link_show}

::: {#cpp_solution_id_3 .wpsolution style="display:none"}
``` {.language-cpp .line-numbers}
#include <iostream>
#include <vector>

int main()
{
    std::vector<int> arr(3); // create a vector of length 3
    
    std::cout << "Enter 3 integers: ";
    std::cin >> arr[0] >> arr[1] >> arr[2];

    std::cout << "The sum is: " << arr[0] + arr[1] + arr[2] << '\n';
    std::cout << "The product is: " << arr[0] * arr[1] * arr[2] << '\n';

    return 0;
}
```
:::

::: {.prevnext}
::: {.prevnext-inline}
[](https://www.learncpp.com/cpp-tutorial/stdvector-and-the-unsigned-length-and-subscript-problem/){.nav-link}

::: {.nav-button .nav-button-next}
::: {.nav-button-icon}
:::

::: {.nav-button-text}
::: {.nav-button-title}
Next lesson
:::

::: {.nav-button-lesson}
[16.3]{.nav-button-lesson-number}std::vector and the unsigned length and
subscript problem
:::
:::
:::

[](https://www.learncpp.com/){.nav-link}

::: {.nav-button .nav-button-index}
::: {.nav-button-icon}
:::

::: {.nav-button-text}
::: {.nav-button-title}
Back to table of contents
:::
:::
:::

[](https://www.learncpp.com/cpp-tutorial/introduction-to-containers-and-arrays/){.nav-link}

::: {.nav-button .nav-button-prev}
::: {.nav-button-icon}
:::

::: {.nav-button-text}
::: {.nav-button-title}
Previous lesson
:::

::: {.nav-button-lesson}
[16.1]{.nav-button-lesson-number}Introduction to containers and arrays
:::
:::
:::
:::
:::

::: {.code-block .code-block-10 style="margin: 8px 0; clear: both;"}
::: {.cf_monitor}
::: {#ezoic-pub-ad-placeholder-106}
:::

[]{.underline}
:::
:::
:::
:::

[ [ ]{itemprop="logo" itemscope=""
itemtype="https://schema.org/ImageObject"}]{.schema-publisher
itemprop="publisher" itemscope=""
itemtype="https://schema.org/Organization"}

::: {.nav-previous}
*Previous Post*[17.1 --- Introduction to
std::array](https://www.learncpp.com/cpp-tutorial/introduction-to-stdarray/)
:::

::: {.nav-next}
*Next Post*[17.x --- Chapter 17 summary and
quiz](https://www.learncpp.com/cpp-tutorial/chapter-17-summary-and-quiz/)
:::

::: {.wpdiscuz_top_clearing}
:::

::: {#comments .comments-area}
::: {#respond style="width: 0;height: 0;clear: both;margin: 0;padding: 0;"}
:::

::: {#wpdcom .wpdiscuz_unauth .wpd-default .wpd-layout-2 .wpd-comments-open}
::: {.wc_social_plugin_wrapper}
:::

::: {.wpd-form-wrap}
::: {.wpd-form-head}
::: {.wpd-auth}
::: {.wpd-login}
:::
:::
:::

::: {#wpd-main-form-wrapper-0_0 .wpd-form .wpd-form-wrapper .wpd-main-form-wrapper}
::: {.wpd-field-comment}
::: {.wpdiscuz-item .wc-field-textarea}
::: {.wpdiscuz-textarea-wrap .wpd-txt}
::: {.wpd-avatar}
![guest](https://secure.gravatar.com/avatar/?s=56&d=mm&r=g){.avatar
.avatar-56 .photo .avatar-default width="56" height="56"
srcset="https://secure.gravatar.com/avatar/?s=112&d=mm&r=g 2x"}
:::

::: {.wpd-textarea-wrap}
::: {#wpd-editor-char-counter-0_0 .wpd-editor-char-counter}
:::

Label
:::

::: {.wpd-editor-buttons-right}
:::
:::
:::
:::

::: {.wpd-form-foot}
::: {.wpdiscuz-textarea-foot}
::: {.wpdiscuz-button-actions}
:::
:::

::: {.wpd-form-row}
::: {.wpd-form-col-left}
::: {.wpdiscuz-item .wc_name-wrapper .wpd-has-icon}
::: {.wpd-field-icon}
:::

Name\*
:::

::: {.wpdiscuz-item .wc_email-wrapper .wpd-has-icon}
::: {.wpd-field-icon}
:::

Email\*

::: {.wpd-field-desc}
Your email address will not be displayed
:::
:::

::: {.cpp_correction_div style="padding-bottom: 4px"}
::: {.wpd-field-icon style="display: inline-block;width: 20px;"}
:::

Find a mistake? Leave a comment above!

::: {.wpd-field-desc}
Correction-related comments will be deleted after processing to help
reduce clutter. Thanks for helping to make the site better for everyone!
:::
:::

::: {.cpp_avatar_div style="padding-bottom: 4px"}
::: {.wpd-field-icon style="display: inline-block;width: 20px;"}
:::

Avatars from <https://gravatar.com/> are connected to your provided
email address.
:::
:::

::: {.wpd-form-col-right}
::: {.wc-field-submit}
[Notify me about replies:  ]{style="margin-top: 6px;"} [ [
]{.wpd_label__check} ]{.wpd_label__text}
:::
:::

::: {.clearfix}
:::
:::
:::
:::

::: {#wpdiscuz_hidden_secondary_form style="display: none;"}
::: {#wpd-secondary-form-wrapper-wpdiscuzuniqueid .wpd-form .wpd-form-wrapper .wpd-secondary-form-wrapper style="display: none;"}
::: {.wpd-secondary-forms-social-content}
:::

::: {.clearfix}
:::

::: {.wpd-field-comment}
::: {.wpdiscuz-item .wc-field-textarea}
::: {.wpdiscuz-textarea-wrap .wpd-txt}
::: {.wpd-avatar}
![guest](https://secure.gravatar.com/avatar/?s=56&d=mm&r=g){.avatar
.avatar-56 .photo .avatar-default width="56" height="56"
srcset="https://secure.gravatar.com/avatar/?s=112&d=mm&r=g 2x"}
:::

::: {.wpd-textarea-wrap}
::: {#wpd-editor-char-counter-wpdiscuzuniqueid .wpd-editor-char-counter}
:::

Label
:::

::: {.wpd-editor-buttons-right}
:::
:::
:::
:::

::: {.wpd-form-foot}
::: {.wpdiscuz-textarea-foot}
::: {.wpdiscuz-button-actions}
:::
:::

::: {.wpd-form-row}
::: {.wpd-form-col-left}
::: {.wpdiscuz-item .wc_name-wrapper .wpd-has-icon}
::: {.wpd-field-icon}
:::

Name\*
:::

::: {.wpdiscuz-item .wc_email-wrapper .wpd-has-icon}
::: {.wpd-field-icon}
:::

Email\*

::: {.wpd-field-desc}
Your email address will not be displayed
:::
:::

::: {.cpp_correction_div style="padding-bottom: 4px"}
::: {.wpd-field-icon style="display: inline-block;width: 20px;"}
:::

Find a mistake? Leave a comment above!

::: {.wpd-field-desc}
Correction-related comments will be deleted after processing to help
reduce clutter. Thanks for helping to make the site better for everyone!
:::
:::

::: {.cpp_avatar_div style="padding-bottom: 4px"}
::: {.wpd-field-icon style="display: inline-block;width: 20px;"}
:::

Avatars from <https://gravatar.com/> are connected to your provided
email address.
:::
:::

::: {.wpd-form-col-right}
::: {.wc-field-submit}
[ [ ]{.wpd_label__check} ]{.wpd_label__text}
:::
:::

::: {.clearfix}
:::
:::
:::
:::
:::
:::

::: {#wpd-threads .wpd-thread-wrapper}
::: {.wpd-thread-head}
::: {.wpd-thread-info data-comments-count="417"}
[417]{.wpdtc title="417"} Comments
:::

::: {.wpd-space}
:::

::: {.wpd-thread-filter}
::: {.wpd-filter .wpdf-sorting}
[Newest]{.wpdiscuz-sort-button .wpdiscuz-date-sort-desc
.wpdiscuz-sort-button-active data-sorting="newest"}

::: {.wpdiscuz-sort-buttons}
[Oldest]{.wpdiscuz-sort-button .wpdiscuz-date-sort-asc
data-sorting="oldest"} [Most Voted]{.wpdiscuz-sort-button
.wpdiscuz-vote-sort-up data-sorting="by_vote"}
:::
:::
:::
:::

::: {.wpd-comment-info-bar}
::: {.wpd-current-view}
 Inline Feedbacks
:::

::: {.wpd-filter-view-all}
View all comments
:::
:::

::: {.wpd-thread-list}
::: {.wpdiscuz-comment-pagination style="display:none;"}
::: {.wpd-load-more-submit-wrap}
Load More Comments
:::
:::
:::
:::
:::
:::

::: {#wpdiscuz-loading-bar .wpdiscuz-loading-bar-unauth}
:::

::: {#wpdiscuz-comment-message .wpdiscuz-comment-message-unauth}
:::
:::

::: {#custom_html-2 .section .widget_text .widget-container .widget_custom_html}
::: {.textwidget .custom-html-widget}
::: {.cf_monitor style="float: right"}
::: {#ezoic-pub-ad-placeholder-103}
:::

[]{.underline}
:::
:::
:::

::: {#custom_html-3 .section .widget_text .widget-container .widget_custom_html}
::: {.textwidget .custom-html-widget}
::: {.cf_monitor style="float: left"}
::: {#ezoic-pub-ad-placeholder-102}
:::

[]{.underline}
:::
:::
:::
:::

::: {#colophon-inside .footer-one}
::: {#text-10 .section .widget-container .widget_text}
::: {.footer-widget-inside}
::: {.textwidget}
*©2022 Learn C++*
:::
:::
:::
:::
:::

::: {#footer-inside}
:::
:::

[wpDiscuz](javascript:void(0);){#wpdUserContentInfoAnchor}

::: {#wpdUserContentInfo .lity-hide style="overflow:auto;background:#FDFDF6;padding:20px;width:600px;max-width:100%;border-radius:6px;"}
:::

::: {#wpd-editor-source-code-wrapper-bg}
:::

::: {#wpd-editor-source-code-wrapper}
Insert
:::

::: {.wpdiscuz-fem-email style="display: none;"}
:::

::: {.wpdiscuz-fem-email-form style="display: none;"}
[You are going to send email to ]{.wpdiscuz-fem-author}

::: {.wpdiscuz_clear}
:::

\

::: {.wpdiscuz-fem-button-align}
Send
:::
:::

::: {.wpdiscuz-fem-moving style="display: none;"}
:::

::: {.wpdiscuz-fem-move-form style="display: none;"}
[Move Comment\
]{.wpdiscuz-fem-author}

::: {.wpdiscuz_clear}
:::

::: {.wpdiscuz-fem-posts-search}
::: {.wpdiscuz-fem-posts}
:::
:::

::: {.wpdiscuz-fem-button-align}
Move
:::
:::

::: {style="display:none;"}
![Quantcast](https://pixel.quantserve.com/pixel/p-31iz6hfFutd16.gif?labels=Domain.learncpp_com,DomainId.221418){width="1"
height="1"}
:::
