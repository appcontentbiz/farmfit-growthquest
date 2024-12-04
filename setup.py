from setuptools import setup, find_packages

setup(
    name="farmfit",
    version="1.0.0",
    packages=find_packages(),
    install_requires=[
        'numpy>=1.21.0',
        'pandas>=1.3.0',
        'scikit-learn>=0.24.0',
        'tensorflow>=2.7.0',
        'torch>=1.9.0',
        'fastapi>=0.68.0',
        'pydantic>=1.8.0',
        'sqlalchemy>=1.4.0',
        'pytest>=6.2.0',
        'black>=21.5b2',
        'mypy>=0.910',
        'flake8>=3.9.0',
    ],
    extras_require={
        'dev': [
            'pytest-cov>=2.12.0',
            'pytest-asyncio>=0.15.0',
            'black>=21.5b2',
            'isort>=5.9.0',
            'mypy>=0.910',
            'flake8>=3.9.0',
        ]
    },
    author="FarmFit Development Team",
    author_email="dev@farmfit.ai",
    description="Advanced Agricultural Technology Platform",
    long_description=open("README.md").read(),
    long_description_content_type="text/markdown",
    url="https://github.com/farmfit/farmfit",
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Science/Research",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
        "Topic :: Scientific/Engineering :: Information Analysis",
    ],
    python_requires=">=3.8",
)
