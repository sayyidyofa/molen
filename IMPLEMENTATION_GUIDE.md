# Implementation Guide for TypeScript Developers

## Introduction

Welcome! This guide is designed for TypeScript developers transitioning to Rust in the Molen project. If you're familiar with the Interface + Factory pattern in TypeScript, you'll find many similar concepts in Rust with traits and factories.

### Quick Reference: TypeScript → Rust

| TypeScript Concept | Rust Equivalent | Notes |
|-------------------|-----------------|-------|
| `interface` | `trait` | Defines behavior contract |
| `class implements Interface` | `impl Trait for Struct` | Implementation |
| `Promise<T>` | `async fn -> Result<T>` | Async operations |
| `async/await` | `async/await` | Same keywords! |
| `new Class()` | `Struct::new()` | Constructor |
| Factory function | Factory function | Similar pattern |
| `try/catch` | `Result<T, E>` and `?` | Error handling |
| `null/undefined` | `Option<T>` | Optional values |
| `any` | `dyn Trait` | Dynamic dispatch |
| `jest.mock()` | Mock structs | Manual mocking |
| `@types/...` | Built-in type system | No separate types needed |

## Part 1: Understanding Traits (Rust's Interfaces)

### Traits vs TypeScript Interfaces

**TypeScript Interface:**
```typescript
interface InferenceProvider {
  infer(transaction: Transaction): Promise<InferenceResult>;
  loadModel(version: string): Promise<void>;
  getModelVersion(): string;
}
```

**Rust Trait:**
```rust
use async_trait::async_trait;

#[async_trait]
pub trait InferenceProvider: Send + Sync {
    async fn infer(&self, transaction: &Transaction) -> Result<InferenceResult>;
    async fn load_model(&mut self, version: &str) -> Result<()>;
    fn get_model_version(&self) -> String;
}
```

**Key Differences:**
- Traits use `#[async_trait]` macro for async methods
- Methods take `&self` (immutable borrow) or `&mut self` (mutable borrow)
- Errors are explicit with `Result<T, E>` instead of thrown exceptions
- `Send + Sync` bounds allow thread-safe usage

## Part 2: Implementing Traits

### Step 1: Define Your Struct

**TypeScript:**
```typescript
class XGBoostProvider implements InferenceProvider {
  private modelVersion: string;
  private model: Model;
  
  constructor(modelPath: string) {
    this.modelVersion = "1.0.0";
    // initialization
  }
}
```

**Rust:**
```rust
pub struct XGBoostProvider {
    model_version: String,
    model: Option<Model>,
    config: XGBoostConfig,
}

impl XGBoostProvider {
    pub fn new(config: XGBoostConfig) -> Self {
        Self {
            model_version: String::from("1.0.0"),
            model: None,
            config,
        }
    }
}
```

### Step 2: Implement the Trait

```rust
#[async_trait]
impl InferenceProvider for XGBoostProvider {
    async fn infer(&self, transaction: &Transaction) -> Result<InferenceResult> {
        // Get model reference
        let model = self.model.as_ref()
            .ok_or_else(|| anyhow::anyhow!("Model not loaded"))?;
        
        // Extract features
        let features = self.extract_features(transaction)?;
        
        // Run inference
        let score = model.predict(&features)?;
        
        // Determine decision
        let decision = if score > 0.8 {
            Decision::BLOCK
        } else if score > 0.5 {
            Decision::FLAG
        } else {
            Decision::PASS
        };
        
        Ok(InferenceResult {
            transaction_id: transaction.id.clone(),
            fraud_score: score,
            decision,
            features: features.into_iter().collect(),
            model_version: self.model_version.clone(),
        })
    }
    
    async fn load_model(&mut self, version: &str) -> Result<()> {
        // Load model from storage
        let model_data = self.fetch_model_data(version).await?;
        self.model = Some(Model::from_bytes(&model_data)?);
        self.model_version = version.to_string();
        Ok(())
    }
    
    fn get_model_version(&self) -> String {
        self.model_version.clone()
    }
}
```

**Key Points:**
- `&self` for methods that don't modify state
- `&mut self` for methods that modify state (like `load_model`)
- `?` operator for error propagation (like `await` but for errors)
- `Result<T>` for operations that can fail

### Step 3: Implement Helper Methods

```rust
impl XGBoostProvider {
    fn extract_features(&self, transaction: &Transaction) -> Result<Vec<f32>> {
        let features = vec![
            transaction.amount,
            transaction.merchant_category as f32,
            // ... more features
        ];
        Ok(features)
    }
    
    async fn fetch_model_data(&self, version: &str) -> Result<Vec<u8>> {
        // Implementation using StorageProvider
        todo!("Implement model fetching")
    }
}
```

## Part 3: Factory Pattern in Rust

### TypeScript Factory Pattern

```typescript
class WorkerFactory {
  static createInferenceProvider(config: Config): InferenceProvider {
    if (config.type === 'xgboost') {
      return new XGBoostProvider(config);
    } else if (config.type === 'mock') {
      return new MockProvider(config);
    }
    throw new Error('Unknown provider type');
  }
}
```

### Rust Factory Pattern

```rust
use std::sync::Arc;

pub struct WorkerFactory;

impl WorkerFactory {
    pub fn create_inference_provider(
        config: WorkerConfig
    ) -> Result<Arc<dyn InferenceProvider>> {
        match config.provider_type.as_str() {
            "xgboost" => {
                let provider = XGBoostProvider::new(config.xgboost_config)?;
                Ok(Arc::new(provider))
            }
            "mock" => {
                let provider = MockInferenceProvider::new();
                Ok(Arc::new(provider))
            }
            _ => Err(anyhow::anyhow!("Unknown provider type: {}", config.provider_type))
        }
    }
    
    pub fn create_mock_provider() -> Arc<dyn InferenceProvider> {
        Arc::new(MockInferenceProvider::new())
    }
}
```

**Key Differences:**
- `Arc<dyn Trait>` is like `Interface` in TypeScript (dynamic dispatch)
- `Arc` provides thread-safe reference counting (like shared pointers)
- `dyn` keyword indicates dynamic dispatch (runtime polymorphism)

### Using the Factory

```rust
// Create provider
let config = WorkerConfig::from_env()?;
let provider = WorkerFactory::create_inference_provider(config)?;

// Use provider (works with any implementation)
let result = provider.infer(&transaction).await?;
```

## Part 4: Writing Tests

### Unit Tests

**TypeScript with Jest:**
```typescript
describe('XGBoostProvider', () => {
  it('should return high fraud score for suspicious transaction', async () => {
    const provider = new XGBoostProvider(config);
    const transaction = createSuspiciousTransaction();
    const result = await provider.infer(transaction);
    expect(result.fraudScore).toBeGreaterThan(0.8);
    expect(result.decision).toBe('BLOCK');
  });
});
```

**Rust with tokio::test:**
```rust
#[cfg(test)]
mod tests {
    use super::*;
    use tokio;
    
    #[tokio::test]
    async fn test_should_return_high_fraud_score_for_suspicious_transaction() {
        // Arrange
        let config = XGBoostConfig::default();
        let mut provider = XGBoostProvider::new(config);
        
        // Load model
        provider.load_model("test-model-v1").await.unwrap();
        
        // Create suspicious transaction
        let transaction = Transaction {
            id: "txn-123".to_string(),
            amount: 10000.0,
            merchant_category: 999,
            // ... more fields
        };
        
        // Act
        let result = provider.infer(&transaction).await.unwrap();
        
        // Assert
        assert!(result.fraud_score > 0.8);
        assert_eq!(result.decision, Decision::BLOCK);
    }
}
```

**Key Points:**
- Use `#[tokio::test]` for async tests (like async in Jest)
- Use `#[cfg(test)]` to mark test modules
- Use `assert!`, `assert_eq!` for assertions (like expect in Jest)
- `.unwrap()` panics on error (okay in tests)

### Mock Implementations

**Creating a Mock:**
```rust
pub struct MockInferenceProvider {
    call_count: std::sync::Arc<std::sync::Mutex<usize>>,
}

impl MockInferenceProvider {
    pub fn new() -> Self {
        Self {
            call_count: Arc::new(Mutex::new(0)),
        }
    }
    
    pub fn get_call_count(&self) -> usize {
        *self.call_count.lock().unwrap()
    }
}

#[async_trait]
impl InferenceProvider for MockInferenceProvider {
    async fn infer(&self, transaction: &Transaction) -> Result<InferenceResult> {
        *self.call_count.lock().unwrap() += 1;
        
        // Return predictable result for testing
        Ok(InferenceResult {
            transaction_id: transaction.id.clone(),
            fraud_score: 0.5,
            decision: Decision::FLAG,
            features: HashMap::new(),
            model_version: "mock-v1".to_string(),
        })
    }
    
    async fn load_model(&mut self, _version: &str) -> Result<()> {
        Ok(())
    }
    
    fn get_model_version(&self) -> String {
        "mock-v1".to_string()
    }
}
```

### Integration Tests

Create `tests/integration_test.rs` in your crate:

```rust
use molen_core::*;
use molen_worker::*;

#[tokio::test]
async fn test_end_to_end_inference_flow() {
    // Create factory
    let config = WorkerConfig {
        provider_type: "mock".to_string(),
        ..Default::default()
    };
    
    let provider = WorkerFactory::create_inference_provider(config)
        .expect("Failed to create provider");
    
    // Create transaction
    let transaction = Transaction {
        id: "test-txn-001".to_string(),
        amount: 500.0,
        // ... other fields
    };
    
    // Run inference
    let result = provider.infer(&transaction).await
        .expect("Inference failed");
    
    // Verify
    assert!(!result.transaction_id.is_empty());
    assert!(result.fraud_score >= 0.0 && result.fraud_score <= 1.0);
}
```

### Testing with Storage and State

```rust
#[tokio::test]
async fn test_provider_with_storage() {
    // Create mock storage
    let storage = Arc::new(MockStorageProvider::new());
    storage.set_model_data("v1", vec![1, 2, 3, 4]);
    
    // Create provider with storage
    let config = XGBoostConfig {
        storage: storage.clone(),
        ..Default::default()
    };
    let mut provider = XGBoostProvider::new(config);
    
    // Load model
    provider.load_model("v1").await.unwrap();
    
    // Verify model loaded
    assert_eq!(provider.get_model_version(), "v1");
}
```

## Part 5: Error Handling

### TypeScript Error Handling

```typescript
async function processTransaction(txn: Transaction): Promise<Result> {
  try {
    const result = await provider.infer(txn);
    return result;
  } catch (error) {
    console.error('Inference failed:', error);
    throw error;
  }
}
```

### Rust Error Handling

```rust
async fn process_transaction(
    txn: &Transaction,
    provider: &dyn InferenceProvider
) -> Result<InferenceResult> {
    // The ? operator propagates errors up
    let result = provider.infer(txn).await?;
    Ok(result)
}

// Or with custom error handling
async fn process_transaction_with_fallback(
    txn: &Transaction,
    provider: &dyn InferenceProvider
) -> Result<InferenceResult> {
    match provider.infer(txn).await {
        Ok(result) => Ok(result),
        Err(e) => {
            eprintln!("Inference failed: {}", e);
            // Return default safe result
            Ok(InferenceResult::safe_default())
        }
    }
}
```

**Using anyhow for error handling:**
```rust
use anyhow::{Context, Result};

async fn load_and_infer(
    provider: &mut dyn InferenceProvider,
    model_version: &str,
    transaction: &Transaction
) -> Result<InferenceResult> {
    provider.load_model(model_version).await
        .context("Failed to load model")?;
    
    provider.infer(transaction).await
        .context("Failed to run inference")
}
```

## Part 6: Common Patterns

### Pattern 1: Dependency Injection

```rust
pub struct InferenceService {
    provider: Arc<dyn InferenceProvider>,
    storage: Arc<dyn StorageProvider>,
    state: Arc<dyn StateProvider>,
}

impl InferenceService {
    pub fn new(
        provider: Arc<dyn InferenceProvider>,
        storage: Arc<dyn StorageProvider>,
        state: Arc<dyn StateProvider>,
    ) -> Self {
        Self { provider, storage, state }
    }
    
    pub async fn process(&self, transaction: &Transaction) -> Result<InferenceResult> {
        // Check blacklist
        if self.state.check_blacklist(&transaction.user_id).await? {
            return Ok(InferenceResult::blocked("User blacklisted"));
        }
        
        // Update velocity
        self.state.increment_velocity_counter(
            &transaction.user_id,
            transaction.amount
        ).await?;
        
        // Run inference
        self.provider.infer(transaction).await
    }
}
```

### Pattern 2: Builder Pattern

```rust
pub struct InferenceServiceBuilder {
    provider: Option<Arc<dyn InferenceProvider>>,
    storage: Option<Arc<dyn StorageProvider>>,
    state: Option<Arc<dyn StateProvider>>,
}

impl InferenceServiceBuilder {
    pub fn new() -> Self {
        Self {
            provider: None,
            storage: None,
            state: None,
        }
    }
    
    pub fn provider(mut self, provider: Arc<dyn InferenceProvider>) -> Self {
        self.provider = Some(provider);
        self
    }
    
    pub fn storage(mut self, storage: Arc<dyn StorageProvider>) -> Self {
        self.storage = Some(storage);
        self
    }
    
    pub fn state(mut self, state: Arc<dyn StateProvider>) -> Self {
        self.state = Some(state);
        self
    }
    
    pub fn build(self) -> Result<InferenceService> {
        Ok(InferenceService {
            provider: self.provider.ok_or_else(|| anyhow::anyhow!("Provider required"))?,
            storage: self.storage.ok_or_else(|| anyhow::anyhow!("Storage required"))?,
            state: self.state.ok_or_else(|| anyhow::anyhow!("State required"))?,
        })
    }
}

// Usage
let service = InferenceServiceBuilder::new()
    .provider(inference_provider)
    .storage(storage_provider)
    .state(state_provider)
    .build()?;
```

## Part 7: Best Practices

### 1. Use Type Aliases for Clarity

```rust
pub type InferenceProviderRef = Arc<dyn InferenceProvider>;
pub type StorageProviderRef = Arc<dyn StorageProvider>;

// Now you can use:
fn create_service(provider: InferenceProviderRef) -> Service {
    // ...
}
```

### 2. Document Public APIs

```rust
/// Provides fraud detection inference using machine learning models.
///
/// # Examples
///
/// ```
/// use molen_core::*;
/// 
/// #[tokio::main]
/// async fn main() -> Result<()> {
///     let provider = XGBoostProvider::new(config)?;
///     let result = provider.infer(&transaction).await?;
///     println!("Fraud score: {}", result.fraud_score);
///     Ok(())
/// }
/// ```
pub trait InferenceProvider: Send + Sync {
    // ...
}
```

### 3. Use `From` and `Into` for Conversions

```rust
impl From<TransactionDTO> for Transaction {
    fn from(dto: TransactionDTO) -> Self {
        Self {
            id: dto.id,
            amount: dto.amount,
            // ... other fields
        }
    }
}

// Usage
let transaction: Transaction = dto.into();
```

### 4. Test Error Cases

```rust
#[tokio::test]
async fn test_infer_fails_without_loaded_model() {
    let provider = XGBoostProvider::new(config);
    let transaction = create_test_transaction();
    
    // Should fail because model not loaded
    let result = provider.infer(&transaction).await;
    assert!(result.is_err());
}
```

## Part 8: Development Workflow

### Building

```bash
# Build all crates
cargo build

# Build specific crate
cargo build -p molen-core

# Build in release mode (optimized)
cargo build --release
```

### Running Tests

```bash
# Run all tests
cargo test

# Run tests for specific crate
cargo test -p molen-core

# Run specific test
cargo test test_should_return_high_fraud_score

# Run tests with output
cargo test -- --nocapture

# Run tests in parallel (default)
cargo test

# Run tests serially
cargo test -- --test-threads=1
```

### Checking Code

```bash
# Check code without building
cargo check

# Run clippy (linter)
cargo clippy

# Format code
cargo fmt

# Generate documentation
cargo doc --open
```

### Running Benchmarks

```bash
# Run benchmarks
cargo bench
```

## Part 9: Common Gotchas for TypeScript Developers

### 1. Ownership and Borrowing

**Wrong:**
```rust
let transaction = create_transaction();
provider1.infer(transaction).await?;  // transaction moved here
provider2.infer(transaction).await?;  // ERROR: transaction already moved
```

**Correct:**
```rust
let transaction = create_transaction();
provider1.infer(&transaction).await?;  // borrow, not move
provider2.infer(&transaction).await?;  // OK: still can borrow
```

### 2. String vs &str

```rust
// String (owned)
let owned: String = String::from("hello");

// &str (borrowed)
let borrowed: &str = "hello";

// Convert String to &str
let s: &str = &owned;

// Convert &str to String
let s: String = borrowed.to_string();
```

### 3. Clone When Needed

```rust
// TypeScript: everything is reference
let a = { value: 42 };
let b = a;  // both refer to same object

// Rust: move by default
let a = MyStruct { value: 42 };
let b = a;  // a is moved, no longer accessible

// To keep a, clone it
let b = a.clone();  // now both exist
```

### 4. Async Requires Runtime

```rust
// Won't work without runtime:
async fn main() {
    // ...
}

// Correct with tokio:
#[tokio::main]
async fn main() {
    // ...
}
```

## Part 10: Next Steps

### For Implementing Traits

1. Start with the mock implementation first
2. Write tests for the mock
3. Then implement the real version
4. Reuse the same tests

### Learning Resources

- [The Rust Book](https://doc.rust-lang.org/book/)
- [Rust by Example](https://doc.rust-lang.org/rust-by-example/)
- [Async Rust Book](https://rust-lang.github.io/async-book/)
- [tokio documentation](https://tokio.rs/)

### Project-Specific Next Steps

1. Implement `InferenceProvider` for XGBoost
2. Implement `StorageProvider` for S3/Garage
3. Implement `StateProvider` for Redis
4. Write comprehensive tests for each
5. Integrate into worker service

## Summary

Key Takeaways for TypeScript Developers:

1. **Traits ≈ Interfaces** - Define contracts for behavior
2. **`impl Trait for Struct` ≈ `class implements Interface`** - Implementation
3. **`Arc<dyn Trait>` ≈ `Interface`** - Dynamic dispatch for polymorphism
4. **`Result<T, E>` ≈ `try/catch`** - Explicit error handling
5. **`Option<T>` ≈ `null/undefined`** - Explicit optional values
6. **`&self` ≈ `this`** - Instance reference
7. **`#[tokio::test]` ≈ `async it(...)`** - Async test syntax
8. **Factory pattern works the same** - Just different syntax

The core concepts you know from TypeScript translate well to Rust. The main differences are:
- More explicit about ownership and borrowing
- More explicit about errors (Result instead of exceptions)
- More explicit about mutability
- Slightly different syntax but same patterns

Good luck implementing! 🦀
