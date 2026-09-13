export interface CppFile {
  path: string;
  name: string;
  category: 'core' | 'renderer' | 'scene' | 'physics' | 'events' | 'scripting';
  content: string;
}

export const CPP_ENGINE_SOURCE_FILES: CppFile[] = [
  {
    path: 'include/Aether/Window.hpp',
    name: 'Window.hpp',
    category: 'core',
    content: `#pragma once
#include <string>
#include <functional>
#include <memory>

namespace Aether {

    struct WindowProps {
        std::string Title = "Aether Engine | OpenGL 3.3 Core";
        uint32_t Width = 1280;
        uint32_t Height = 720;
        bool VSync = true;
        bool Fullscreen = false;
        bool Resizable = true;
    };

    class Window {
    public:
        using EventCallbackFn = std::function<void(class Event&)>;

        virtual ~Window() = default;

        virtual void OnUpdate() = 0;
        virtual uint32_t GetWidth() const = 0;
        virtual uint32_t GetHeight() const = 0;
        virtual void SetEventCallback(const EventCallbackFn& callback) = 0;
        virtual void SetVSync(bool enabled) = 0;
        virtual bool IsVSync() const = 0;
        virtual void* GetNativeWindow() const = 0;

        static std::unique_ptr<Window> Create(const WindowProps& props = WindowProps());
    };

} // namespace Aether`
  },
  {
    path: 'include/Aether/Shader.hpp',
    name: 'Shader.hpp',
    category: 'renderer',
    content: `#pragma once
#include <string>
#include <unordered_map>
#include <glm/glm.hpp>

namespace Aether {

    class Shader {
    public:
        Shader(const std::string& name, const std::string& vertexSrc, const std::string& fragmentSrc);
        ~Shader();

        void Bind() const;
        void Unbind() const;

        // Uniform Setters with caching
        void SetInt(const std::string& name, int value);
        void SetFloat(const std::string& name, float value);
        void SetFloat3(const std::string& name, const glm::vec3& value);
        void SetFloat4(const std::string& name, const glm::vec4& value);
        void SetMat4(const std::string& name, const glm::mat4& matrix);

        const std::string& GetName() const { return m_Name; }
        uint32_t GetRendererID() const { return m_RendererID; }

    private:
        uint32_t CompileShader(uint32_t type, const std::string& source);
        int32_t GetUniformLocation(const std::string& name) const;

        uint32_t m_RendererID = 0;
        std::string m_Name;
        mutable std::unordered_map<std::string, int32_t> m_UniformLocationCache;
    };

} // namespace Aether`
  },
  {
    path: 'include/Aether/SceneGraph.hpp',
    name: 'SceneGraph.hpp',
    category: 'scene',
    content: `#pragma once
#include <string>
#include <vector>
#include <memory>
#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>

namespace Aether {

    struct Transform {
        glm::vec3 Position{ 0.0f, 0.0f, 0.0f };
        glm::vec3 Rotation{ 0.0f, 0.0f, 0.0f }; // Degrees
        glm::vec3 Scale{ 1.0f, 1.0f, 1.0f };

        glm::mat4 GetLocalMatrix() const {
            glm::mat4 mat = glm::translate(glm::mat4(1.0f), Position);
            mat = glm::rotate(mat, glm::radians(Rotation.x), glm::vec3(1.0f, 0.0f, 0.0f));
            mat = glm::rotate(mat, glm::radians(Rotation.y), glm::vec3(0.0f, 1.0f, 0.0f));
            mat = glm::rotate(mat, glm::radians(Rotation.z), glm::vec3(0.0f, 0.0f, 1.0f));
            return glm::scale(mat, Scale);
        }
    };

    class SceneNode : public std::enable_shared_from_this<SceneNode> {
    public:
        SceneNode(const std::string& name = "Node") : m_Name(name) {}

        void AddChild(std::shared_ptr<SceneNode> child) {
            child->m_Parent = shared_from_this();
            m_Children.push_back(child);
            MarkDirty();
        }

        void UpdateWorldTransform(const glm::mat4& parentMatrix = glm::mat4(1.0f)) {
            m_WorldMatrix = parentMatrix * m_Transform.GetLocalMatrix();
            for (auto& child : m_Children) {
                child->UpdateWorldTransform(m_WorldMatrix);
            }
        }

        const glm::mat4& GetWorldMatrix() const { return m_WorldMatrix; }
        Transform& GetTransform() { return m_Transform; }

    private:
        void MarkDirty() { /* invalidate cached bounding boxes and bounds */ }

        std::string m_Name;
        Transform m_Transform;
        glm::mat4 m_WorldMatrix{ 1.0f };
        std::weak_ptr<SceneNode> m_Parent;
        std::vector<std::shared_ptr<SceneNode>> m_Children;
    };

} // namespace Aether`
  },
  {
    path: 'include/Aether/Physics.hpp',
    name: 'Physics.hpp',
    category: 'physics',
    content: `#pragma once
#include <glm/glm.hpp>
#include <vector>

namespace Aether {

    enum class ColliderType { Box, Sphere, Capsule };

    struct RigidBody {
        bool IsStatic = false;
        float Mass = 1.0f;
        float Restitution = 0.5f; // Bounciness
        float Friction = 0.3f;
        glm::vec3 Velocity{ 0.0f, 0.0f, 0.0f };
        glm::vec3 Acceleration{ 0.0f, -9.81f, 0.0f };
        glm::vec3 ForceAccumulator{ 0.0f };
        ColliderType Collider = ColliderType::Box;
    };

    class PhysicsEngine {
    public:
        static void StepSimulation(float deltaTime) {
            // Semi-implicit Euler integration
            // Broadphase spatial hashing & Narrowphase SAT collision check
        }

        static void ApplyImpulse(RigidBody& rb, const glm::vec3& impulse) {
            if (rb.IsStatic) return;
            rb.Velocity += impulse / rb.Mass;
        }
    };

} // namespace Aether`
  },
  {
    path: 'include/Aether/EventSystem.hpp',
    name: 'EventSystem.hpp',
    category: 'events',
    content: `#pragma once
#include <string>
#include <functional>
#include <unordered_map>
#include <vector>

namespace Aether {

    enum class EventType {
        WindowClose, WindowResize, WindowFocus,
        KeyPressed, KeyReleased, MouseButtonPressed, MouseMoved,
        CollisionEnter, CollisionExit,
        Tick, Render
    };

    class Event {
    public:
        virtual ~Event() = default;
        virtual EventType GetEventType() const = 0;
        virtual const char* GetName() const = 0;
        bool Handled = false;
    };

    class EventDispatcher {
    public:
        template<typename T, typename F>
        static bool Dispatch(Event& event, const F& func) {
            if (event.GetEventType() == T::GetStaticType()) {
                event.Handled |= func(static_cast<T&>(event));
                return true;
            }
            return false;
        }
    };

} // namespace Aether`
  },
  {
    path: 'include/Aether/ScriptAPI.hpp',
    name: 'ScriptAPI.hpp',
    category: 'scripting',
    content: `#pragma once
#include <string>

namespace Aether {

    class ScriptableEntity {
    public:
        virtual ~ScriptableEntity() = default;

        virtual void OnCreate() {}
        virtual void OnUpdate(float deltaTime) {}
        virtual void OnCollisionEnter(class SceneNode* other) {}
        virtual void OnDestroy() {}

    protected:
        template<typename T>
        T& GetComponent() {
            // Fast entity component query
            static T dummy;
            return dummy;
        }
    };

} // namespace Aether`
  },
  {
    path: 'src/main.cpp',
    name: 'main.cpp',
    category: 'core',
    content: `#include <Aether/Window.hpp>
#include <Aether/Shader.hpp>
#include <Aether/SceneGraph.hpp>
#include <Aether/Physics.hpp>
#include <Aether/EventSystem.hpp>
#include <iostream>
#include <glad/glad.h>
#include <GLFW/glfw3.h>

int main(int argc, char** argv) {
    std::cout << "[Aether Engine] Initializing Core Subsystems..." << std::endl;

    auto window = Aether::Window::Create({ "Aether Engine v2.4", 1920, 1080, true });
    if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress)) {
        std::cerr << "[OpenGL] Failed to initialize GLAD!" << std::endl;
        return -1;
    }

    glEnable(GL_DEPTH_TEST);
    glEnable(GL_CULL_FACE);
    glCullFace(GL_BACK);

    auto rootScene = std::make_shared<Aether::SceneNode>("RootScene");

    double lastTime = glfwGetTime();
    while (!glfwWindowShouldClose((GLFWwindow*)window->GetNativeWindow())) {
        double currentTime = glfwGetTime();
        float deltaTime = static_cast<float>(currentTime - lastTime);
        lastTime = currentTime;

        // Process input & window events
        window->OnUpdate();

        // Physics step
        Aether::PhysicsEngine::StepSimulation(deltaTime);

        // Update Scene Graph
        rootScene->UpdateWorldTransform();

        // Render pass
        glClearColor(0.06f, 0.07f, 0.09f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

        glfwSwapBuffers((GLFWwindow*)window->GetNativeWindow());
        glfwPollEvents();
    }

    std::cout << "[Aether Engine] Clean shutdown completed." << std::endl;
    return 0;
}`
  }
];
