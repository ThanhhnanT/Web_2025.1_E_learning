import numpy as np
import random
import matplotlib.pyplot as plt

# --- Tính độ dài hành trình ---
def tour_length(tour, dist_matrix):
    length = 0
    for i in range(len(tour)):
        length += dist_matrix[tour[i]][tour[(i+1) % len(tour)]]
    return length

# --- Khởi tạo quần thể ---
def init_population(pop_size, num_cities):
    population = []
    for _ in range(pop_size):
        tour = list(range(num_cities))
        random.shuffle(tour)
        population.append(tour)
    return population

# --- Chọn lọc: tournament selection ---
def selection(population, dist_matrix, k=3):
    selected = random.sample(population, k)
    selected.sort(key=lambda t: tour_length(t, dist_matrix))
    return selected[0]

# --- Lai ghép: Order Crossover (OX) ---
def crossover(p1, p2):
    size = len(p1)
    a, b = sorted(random.sample(range(size), 2))
    child = [None] * size
    child[a:b] = p1[a:b]
    fill = [c for c in p2 if c not in child]
    pos = 0
    for i in range(size):
        if child[i] is None:
            child[i] = fill[pos]
            pos += 1
    return child

# --- Đột biến: swap mutation ---
def mutate(tour, mutation_rate=0.2):
    tour = tour[:]
    if random.random() < mutation_rate:
        a, b = random.sample(range(len(tour)), 2)
        tour[a], tour[b] = tour[b], tour[a]
    return tour

# --- GA chính ---
def genetic_algorithm(dist_matrix, coords, pop_size=100, generations=500, mutation_rate=0.2):
    num_cities = len(dist_matrix)
    population = init_population(pop_size, num_cities)

    best = min(population, key=lambda t: tour_length(t, dist_matrix))
    best_length = tour_length(best, dist_matrix)

    history = [best_length]  # lưu lịch sử best length

    for gen in range(generations):
        new_pop = []
        for _ in range(pop_size):
            p1 = selection(population, dist_matrix)
            p2 = selection(population, dist_matrix)
            child = crossover(p1, p2)
            child = mutate(child, mutation_rate)
            new_pop.append(child)
        population = new_pop

        current_best = min(population, key=lambda t: tour_length(t, dist_matrix))
        current_length = tour_length(current_best, dist_matrix)

        if current_length < best_length:
            best, best_length = current_best, current_length

        history.append(best_length)

    # --- Vẽ biểu đồ hội tụ ---
    plt.figure(figsize=(12,5))
    plt.subplot(1,2,1)
    plt.plot(history, label="Best length")
    plt.xlabel("Generation")
    plt.ylabel("Path length")
    plt.title("GA Convergence")
    plt.legend()

    # --- Vẽ tour tốt nhất ---
    plt.subplot(1,2,2)
    x = coords[:,0]
    y = coords[:,1]
    best_coords = coords[best + [best[0]]]  # quay lại điểm đầu
    plt.scatter(x, y, c="red")
    plt.plot(best_coords[:,0], best_coords[:,1], c="blue", lw=2)
    for i, (xi, yi) in enumerate(zip(x,y)):
        plt.text(xi, yi, str(i), fontsize=9, color="black")
    plt.title(f"Best Tour (length = {best_length:.2f})")

    plt.tight_layout()
    plt.show()

    return best, best_length, history

# --- Demo ---
if __name__ == "__main__":
    # Ví dụ: 10 thành phố với tọa độ ngẫu nhiên
    num_cities = 15
    coords = np.random.rand(num_cities, 2) * 100
    dist_matrix = np.sqrt(((coords[:, None, :] - coords[None, :, :]) ** 2).sum(axis=2))

    best_tour, best_len, history = genetic_algorithm(dist_matrix, coords, pop_size=200, generations=500)

    print("\nBest tour:", best_tour)
    print("Best length:", best_len)
