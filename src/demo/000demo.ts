
interface Animal {
  name: string;
}

interface Dog extends Animal {
  bark(): void;
}

// 只负责生产数据
type Producer<T> = () => T;

// 只负责消费数据
type Consumer<T> = (value: T) => void;

declare let animalProducer: Producer<Animal>;
declare let dogProducer: Producer<Dog>;

declare let animalConsumer: Consumer<Animal>;
declare let dogConsumer: Consumer<Dog>;

// A
animalProducer = dogProducer;

// B
dogProducer = animalProducer;

// C
animalConsumer = dogConsumer;

// D
dogConsumer = animalConsumer;
