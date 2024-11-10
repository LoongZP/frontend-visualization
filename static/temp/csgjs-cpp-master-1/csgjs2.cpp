// Original CSG.JS library by Evan Wallace (http://madebyevan.com), under the MIT license.
// GitHub: https://github.com/evanw/csg.js/
//
// C++ port by Tomasz Dabrowski (http://28byteslater.com), under the MIT license.
// GitHub: https://github.com/dabroz/csgjs-cpp/
//
// Constructive Solid Geometry (CSG) is a modeling technique that uses Boolean
// operations like union and intersection to combine 3D solids. This library
// implements CSG operations on meshes elegantly and concisely using BSP trees,
// and is meant to serve as an easily understandable implementation of the
// algorithm. All edge cases involving overlapping coplanar polygons in both
// solids are correctly handled.
//
// To use this as a header file, define CSGJS_HEADER_ONLY before including this file.
//

#include <list>
#include <vector>
#include <algorithm>
#include <math.h>
#include <emscripten/emscripten.h>
#include <emscripten/bind.h>
using namespace emscripten;

// IMPLEMENTATION BELOW ---------------------------------------------------------------------------

#ifndef CSGJS_HEADER_ONLY

// `CSG.Plane.EPSILON` is the tolerance used by `splitPolygon()` to decide if a
// point is on the plane.
static const float csgjs_EPSILON = 0.00001f;

struct csgjs_vector;
struct csgjs_vertex;
struct csgjs_model;
struct csgjs_node;
struct csgjs_plane;
struct csgjs_polygon;
struct csgjs_node;

inline static csgjs_vertex flip(csgjs_vertex v);
inline static csgjs_vertex interpolate(const csgjs_vertex &a, const csgjs_vertex &b, float t);
inline static csgjs_node *csg_union(const csgjs_node *a1, const csgjs_node *b1);
inline static csgjs_node *csg_subtract(const csgjs_node *a1, const csgjs_node *b1);
inline static csgjs_node *csg_intersect(const csgjs_node *a1, const csgjs_node *b1);
inline static std::vector<csgjs_polygon> csgjs_modelToPolygons(const csgjs_model &model);
inline static csgjs_model csgjs_modelFromPolygons(const std::vector<csgjs_polygon> &polygons);
typedef csgjs_node *csg_function(const csgjs_node *a1, const csgjs_node *b1);
inline static csgjs_model csgjs_operation(const csgjs_model &a, const csgjs_model &b, csg_function fun);
csgjs_model csgjs_union(const csgjs_model &a, const csgjs_model &b);
csgjs_model csgjs_intersection(const csgjs_model &a, const csgjs_model &b);
csgjs_model csgjs_difference(const csgjs_model &a, const csgjs_model &b);

// TODO csgjs_vector
struct csgjs_vector
{
    float x, y, z;
    float getX() const
    {
        return this->x;
    }
    void setX(float _x)
    {
        this->x = _x;
    }
    float getY() const
    {
        return this->y;
    }
    void setY(float _y)
    {
        this->y = _y;
    }
    float getZ() const
    {
        return this->z;
    }
    void setZ(float _z)
    {
        this->z = _z;
    }
    csgjs_vector() : x(0.0f), y(0.0f), z(0.0f) {}
    explicit csgjs_vector(float x, float y, float z) : x(x), y(y), z(z) {}
};

// Vector implementation
inline static csgjs_vector operator+(const csgjs_vector &a, const csgjs_vector &b) { return csgjs_vector(a.x + b.x, a.y + b.y, a.z + b.z); }
inline static csgjs_vector operator-(const csgjs_vector &a, const csgjs_vector &b) { return csgjs_vector(a.x - b.x, a.y - b.y, a.z - b.z); }
inline static csgjs_vector operator*(const csgjs_vector &a, float b) { return csgjs_vector(a.x * b, a.y * b, a.z * b); }
inline static csgjs_vector operator/(const csgjs_vector &a, float b) { return a * (1.0f / b); }
inline static float dot(const csgjs_vector &a, const csgjs_vector &b) { return a.x * b.x + a.y * b.y + a.z * b.z; }
inline static csgjs_vector lerp(const csgjs_vector &a, const csgjs_vector &b, float v) { return a + (b - a) * v; }
inline static csgjs_vector negate(const csgjs_vector &a) { return a * -1.0f; }
inline static float length(const csgjs_vector &a) { return sqrtf(dot(a, a)); }
inline static csgjs_vector unit(const csgjs_vector &a) { return a / length(a); }
inline static csgjs_vector cross(const csgjs_vector &a, const csgjs_vector &b) { return csgjs_vector(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x); }

// TODO csgjs_vertex
struct csgjs_vertex
{
    csgjs_vector position;
    csgjs_vector getPosition() const
    {
        return this->position;
    };
    void setPosition(csgjs_vector _position)
    {
        this->position = _position;
    };

    csgjs_vector normal;
    csgjs_vector getNormal() const
    {
        return this->normal;
    };
    void setNormal(csgjs_vector _normal)
    {
        this->normal = _normal;
    };

    csgjs_vector uv;
    csgjs_vector getUV() const
    {
        return this->uv;
    };
    void setUV(csgjs_vector _uv)
    {
        this->uv = _uv;
    };
};

// TODO csgjs_model
struct csgjs_model
{
    std::vector<csgjs_vertex> vertices;
    std::vector<csgjs_vertex> getVertices() const
    {
        return this->vertices;
    };
    void setVertices(std::vector<csgjs_vertex> _vertices)
    {
        this->vertices = _vertices;
    };

    std::vector<int> indices;
    std::vector<int> getIndices() const
    {
        return this->indices;
    };
    void setIndices(std::vector<int> _indices)
    {
        this->indices = _indices;
    };
};

// TODO csgjs_plane
// Represents a plane in 3D space.
struct csgjs_plane
{
    csgjs_vector normal;
    csgjs_vector getNormal() const
    {
        return this->normal;
    };
    void setNormal(csgjs_vector _normal)
    {
        this->normal = _normal;
    };

    float w;
    float getW() const
    {
        return this->w;
    };
    void setW(float _w)
    {
        this->w = _w;
    };

    csgjs_plane();
    csgjs_plane(const csgjs_vector &a, const csgjs_vector &b, const csgjs_vector &c);

    bool ok() const;
    void flip();
    void splitPolygon(const csgjs_polygon &polygon, std::vector<csgjs_polygon> &coplanarFront, std::vector<csgjs_polygon> &coplanarBack, std::vector<csgjs_polygon> &front, std::vector<csgjs_polygon> &back) const;
};
// TODO csgjs_polygon
struct csgjs_polygon
{
    std::vector<csgjs_vertex> vertices;

    std::vector<csgjs_vertex> getVertices() const
    {
        return this->vertices;
    };
    void setVertices(std::vector<csgjs_vertex> _vertices)
    {
        this->vertices = _vertices;
    };

    csgjs_plane plane;
    csgjs_plane getPlane() const
    {
        return this->plane;
    };
    void setPlane(csgjs_plane _plane)
    {
        this->plane = _plane;
    };

    csgjs_polygon();
    csgjs_polygon(const std::vector<csgjs_vertex> &list);

    void flip();
};
// TODO csgjs_node
// Holds a node in a BSP tree. A BSP tree is built from a collection of polygons
// by picking a polygon to split along. That polygon (and all other coplanar
// polygons) are added directly to that node and the other polygons are added to
// the front and/or back subtrees. This is not a leafy BSP tree since there is
// no distinction between internal and leaf nodes.
struct csgjs_node
{
    std::vector<csgjs_polygon> polygons;
    std::vector<csgjs_polygon> getPolygons() const
    {
        return this->polygons;
    };
    void setPolygons(std::vector<csgjs_polygon> _polygons)
    {
        this->polygons = _polygons;
    };
    csgjs_node *front;
    csgjs_node *getFront() const
    {
        return this->front;
    };
    void setFront(csgjs_node *_front)
    {
        this->front = _front;
    };
    // csgjs_node getFront1() const
    // {
    //     return *this->front;
    // };
    // void setFront1(csgjs_node _front)
    // {
    //     this->front = &_front;
    // };
    csgjs_node *back;
    csgjs_node *getBack() const
    {
        return this->back;
    };
    void setBack(csgjs_node *_back)
    {
        this->back = _back;
    };
    csgjs_plane plane;
    csgjs_plane getPlane() const
    {
        return this->plane;
    };
    void setPlane(csgjs_plane _plane)
    {
        this->plane = _plane;
    };

    csgjs_node();
    csgjs_node(const std::vector<csgjs_polygon> &list);
    ~csgjs_node();

    void clipTo(const csgjs_node *other);
    void invert();
    void build(const std::vector<csgjs_polygon> &polygon);
    csgjs_node *clone() const;
    std::vector<csgjs_polygon> clipPolygons(const std::vector<csgjs_polygon> &list) const;
    std::vector<csgjs_polygon> allPolygons() const;
};

// TODO csgjs_plane
// Plane implementation
csgjs_plane::csgjs_plane() : normal(), w(0.0f)
{
}
csgjs_plane::csgjs_plane(const csgjs_vector &a, const csgjs_vector &b, const csgjs_vector &c)
{
    this->normal = unit(cross(b - a, c - a));
    this->w = dot(this->normal, a);
}

bool csgjs_plane::ok() const
{
    return length(this->normal) > 0.0f;
}
void csgjs_plane::flip()
{
    this->normal = negate(this->normal);
    this->w *= -1.0f;
}
// Split `polygon` by this plane if needed, then put the polygon or polygon
// fragments in the appropriate lists. Coplanar polygons go into either
// `coplanarFront` or `coplanarBack` depending on their orientation with
// respect to this plane. Polygons in front or in back of this plane go into
// either `front` or `back`.
void csgjs_plane::splitPolygon(const csgjs_polygon &polygon,
                               std::vector<csgjs_polygon> &coplanarFront,
                               std::vector<csgjs_polygon> &coplanarBack,
                               std::vector<csgjs_polygon> &front,
                               std::vector<csgjs_polygon> &back) const
{
    enum
    {
        COPLANAR = 0,
        FRONT = 1,
        BACK = 2,
        SPANNING = 3
    };

    // Classify each point as well as the entire polygon into one of the above
    // four classes.
    int polygonType = 0;
    std::vector<int> types;

    for (size_t i = 0; i < polygon.vertices.size(); i++)
    {
        float t = dot(this->normal, polygon.vertices[i].position) - this->w;
        int type = (t < -csgjs_EPSILON) ? BACK : ((t > csgjs_EPSILON) ? FRONT : COPLANAR);
        polygonType |= type;
        types.push_back(type);
    }

    // Put the polygon in the correct list, splitting it when necessary.
    switch (polygonType)
    {
    case COPLANAR:
    {
        if (dot(this->normal, polygon.plane.normal) > 0)
            coplanarFront.push_back(polygon);
        else
            coplanarBack.push_back(polygon);
        break;
    }
    case FRONT:
    {
        front.push_back(polygon);
        break;
    }
    case BACK:
    {
        back.push_back(polygon);
        break;
    }
    case SPANNING:
    {
        std::vector<csgjs_vertex> f, b;
        for (size_t i = 0; i < polygon.vertices.size(); i++)
        {
            int j = (i + 1) % polygon.vertices.size();
            int ti = types[i], tj = types[j];
            csgjs_vertex vi = polygon.vertices[i], vj = polygon.vertices[j];
            if (ti != BACK)
                f.push_back(vi);
            if (ti != FRONT)
                b.push_back(vi);
            if ((ti | tj) == SPANNING)
            {
                float t = (this->w - dot(this->normal, vi.position)) / dot(this->normal, vj.position - vi.position);
                csgjs_vertex v = interpolate(vi, vj, t);
                f.push_back(v);
                b.push_back(v);
            }
        }
        if (f.size() >= 3)
        {
        }
        front.push_back(csgjs_polygon(f));
        if (b.size() >= 3)
            back.push_back(csgjs_polygon(b));
        break;
    }
    }
}

// TODO csgjs_polygon
// Represents a convex polygon. The vertices used to initialize a polygon must
// be coplanar and form a convex loop. They do not have to be `CSG.Vertex`
// instances but they must behave similarly (duck typing can be used for
// customization).
//
// Each convex polygon has a `shared` property, which is shared between all
// polygons that are clones of each other or were split from the same polygon.
// This can be used to define per-polygon properties (such as surface color).

// Polygon implementation
csgjs_polygon::csgjs_polygon()
{
}
csgjs_polygon::csgjs_polygon(const std::vector<csgjs_vertex> &list) : vertices(list), plane(vertices[0].position, vertices[1].position, vertices[2].position)
{
}
void csgjs_polygon::flip()
{
    std::reverse(vertices.begin(), vertices.end());
    for (size_t i = 0; i < vertices.size(); i++)
        vertices[i].normal = negate(vertices[i].normal);
    plane.flip();
}

// TODO csgjs_node
csgjs_node::csgjs_node() : front(0), back(0)
{
}
csgjs_node::csgjs_node(const std::vector<csgjs_polygon> &list) : front(0), back(0)
{
    build(list);
}
csgjs_node::~csgjs_node()
{
    std::list<csgjs_node *> nodes_to_delete;

    std::list<csgjs_node *> nodes_to_disassemble;
    nodes_to_disassemble.push_back(this);
    while (nodes_to_disassemble.size())
    {
        csgjs_node *me = nodes_to_disassemble.front();
        nodes_to_disassemble.pop_front();

        if (me->front)
        {
            nodes_to_disassemble.push_back(me->front);
            nodes_to_delete.push_back(me->front);
            me->front = NULL;
        }
        if (me->back)
        {
            nodes_to_disassemble.push_back(me->back);
            nodes_to_delete.push_back(me->back);
            me->back = NULL;
        }
    }

    for (std::list<csgjs_node *>::iterator it = nodes_to_delete.begin(); it != nodes_to_delete.end(); ++it)
        delete *it;
}

// Convert solid space to empty space and empty space to solid space.
void csgjs_node::invert()
{
    std::list<csgjs_node *> nodes;
    nodes.push_back(this);
    while (nodes.size())
    {
        csgjs_node *me = nodes.front();
        nodes.pop_front();

        for (size_t i = 0; i < me->polygons.size(); i++)
            me->polygons[i].flip();
        me->plane.flip();
        std::swap(me->front, me->back);
        if (me->front)
            nodes.push_back(me->front);
        if (me->back)
            nodes.push_back(me->back);
    }
}
// Remove all polygons in this BSP tree that are inside the other BSP tree
// `bsp`.
void csgjs_node::clipTo(const csgjs_node *other)
{
    std::list<csgjs_node *> nodes;
    nodes.push_back(this);
    while (nodes.size())
    {
        csgjs_node *me = nodes.front();
        nodes.pop_front();

        me->polygons = other->clipPolygons(me->polygons);
        if (me->front)
            nodes.push_back(me->front);
        if (me->back)
            nodes.push_back(me->back);
    }
}

// Build a BSP tree out of `polygons`. When called on an existing tree, the
// new polygons are filtered down to the bottom of the tree and become new
// nodes there. Each set of polygons is partitioned using the first polygon
// (no heuristic is used to pick a good split).
void csgjs_node::build(const std::vector<csgjs_polygon> &list)
{
    if (!list.size())
        return;

    std::list<std::pair<csgjs_node *, std::vector<csgjs_polygon>>> builds;
    builds.push_back(std::make_pair(this, list));
    while (builds.size())
    {
        csgjs_node *me = builds.front().first;
        std::vector<csgjs_polygon> list = builds.front().second;
        builds.pop_front();

        if (!me->plane.ok())
            me->plane = list[0].plane;
        std::vector<csgjs_polygon> list_front, list_back;
        // for (size_t i = 0; i < list.size(); i++)
        //     me->plane.splitPolygon(list[i], me->polygons, me->polygons, list_front, list_back);
        me->polygons.push_back(list[0]);
        for (size_t i = 1; i < list.size(); i++)
            me->plane.splitPolygon(list[i], me->polygons, me->polygons, list_front, list_back);

        if (list_front.size())
        {
            if (!me->front)
                me->front = new csgjs_node;
            builds.push_back(std::make_pair(me->front, list_front));
        }
        if (list_back.size())
        {
            if (!me->back)
                me->back = new csgjs_node;
            builds.push_back(std::make_pair(me->back, list_back));
        }
    }
}

// Recursively remove all polygons in `polygons` that are inside this BSP tree.
std::vector<csgjs_polygon> csgjs_node::clipPolygons(const std::vector<csgjs_polygon> &list) const
{
    std::vector<csgjs_polygon> result;

    std::list<std::pair<const csgjs_node *const, std::vector<csgjs_polygon>>> clips;
    clips.push_back(std::make_pair(this, list));
    while (clips.size())
    {
        const csgjs_node *me = clips.front().first;
        std::vector<csgjs_polygon> list = clips.front().second;
        clips.pop_front();

        if (!me->plane.ok())
        {
            result.insert(result.end(), list.begin(), list.end());
            continue;
        }

        std::vector<csgjs_polygon> list_front, list_back;
        for (size_t i = 0; i < list.size(); i++)
            me->plane.splitPolygon(list[i], list_front, list_back, list_front, list_back);

        if (me->front)
            clips.push_back(std::make_pair(me->front, list_front));
        else
            result.insert(result.end(), list_front.begin(), list_front.end());

        if (me->back)
            clips.push_back(std::make_pair(me->back, list_back));
    }

    return result;
}

// Return a list of all polygons in this BSP tree.
std::vector<csgjs_polygon> csgjs_node::allPolygons() const
{
    std::vector<csgjs_polygon> result;

    std::list<const csgjs_node *> nodes;
    nodes.push_back(this);
    while (nodes.size())
    {
        const csgjs_node *me = nodes.front();
        nodes.pop_front();

        result.insert(result.end(), me->polygons.begin(), me->polygons.end());
        if (me->front)
            nodes.push_back(me->front);
        if (me->back)
            nodes.push_back(me->back);
    }

    return result;
}

csgjs_node *csgjs_node::clone() const
{
    csgjs_node *ret = new csgjs_node();

    std::list<std::pair<const csgjs_node *, csgjs_node *>> nodes;
    nodes.push_back(std::make_pair(this, ret));
    while (nodes.size())
    {
        const csgjs_node *original = nodes.front().first;
        csgjs_node *clone = nodes.front().second;
        nodes.pop_front();

        clone->polygons = original->polygons;
        clone->plane = original->plane;
        if (original->front)
        {
            clone->front = new csgjs_node();
            nodes.push_back(std::make_pair(original->front, clone->front));
        }
        if (original->back)
        {
            clone->back = new csgjs_node();
            nodes.push_back(std::make_pair(original->back, clone->back));
        }
    }

    return ret;
}

// TODO
// Vertex implementation
// Invert all orientation-specific data (e.g. vertex normal). Called when the
// orientation of a polygon is flipped.
inline static csgjs_vertex flip(csgjs_vertex v)
{
    v.normal = negate(v.normal);
    return v;
}
// Create a new vertex between this vertex and `other` by linearly
// interpolating all properties using a parameter of `t`. Subclasses should
// override this to interpolate additional properties.
inline static csgjs_vertex interpolate(const csgjs_vertex &a, const csgjs_vertex &b, float t)
{
    csgjs_vertex ret;
    ret.position = lerp(a.position, b.position, t);
    ret.normal = lerp(a.normal, b.normal, t);
    ret.uv = lerp(a.uv, b.uv, t);
    return ret;
}

// Public interface implementation
inline static std::vector<csgjs_polygon> csgjs_modelToPolygons(const csgjs_model &model)
{
    std::vector<csgjs_polygon> list;
    for (size_t i = 0; i < model.indices.size(); i += 3)
    {
        std::vector<csgjs_vertex> triangle;
        for (int j = 0; j < 3; j++)
        {
            csgjs_vertex v = model.vertices[model.indices[i + j]];
            triangle.push_back(v);
        }
        list.push_back(csgjs_polygon(triangle));
    }
    return list;
}

inline static csgjs_model csgjs_modelFromPolygons(const std::vector<csgjs_polygon> &polygons)
{
    csgjs_model model;
    int p = 0;
    for (size_t i = 0; i < polygons.size(); i++)
    {
        const csgjs_polygon &poly = polygons[i];
        for (size_t j = 2; j < poly.vertices.size(); j++)
        {
            model.vertices.push_back(poly.vertices[0]);
            model.indices.push_back(p++);
            model.vertices.push_back(poly.vertices[j - 1]);
            model.indices.push_back(p++);
            model.vertices.push_back(poly.vertices[j]);
            model.indices.push_back(p++);
        }
    }
    return model;
}

// typedef csgjs_node *csg_function(const csgjs_node *a1, const csgjs_node *b1);
// Node implementation
// Return a new CSG solid representing space in either this solid or in the
// solid `csg`. Neither this solid nor the solid `csg` are modified.
inline static csgjs_node *csg_union(const csgjs_node *a1, const csgjs_node *b1)
{
    csgjs_node *a = a1->clone();
    csgjs_node *b = b1->clone();
    a->clipTo(b);
    b->clipTo(a);
    b->invert();
    b->clipTo(a);
    b->invert();
    a->build(b->allPolygons());
    csgjs_node *ret = new csgjs_node(a->allPolygons());
    delete a;
    a = 0;
    delete b;
    b = 0;
    return ret;
}

// Return a new CSG solid representing space in this solid but not in the
// solid `csg`. Neither this solid nor the solid `csg` are modified.
inline static csgjs_node *csg_subtract(const csgjs_node *a1, const csgjs_node *b1)
{
    csgjs_node *a = a1->clone();
    csgjs_node *b = b1->clone();
    a->invert();
    a->clipTo(b);
    b->clipTo(a);
    b->invert();
    b->clipTo(a);
    b->invert();
    a->build(b->allPolygons());
    a->invert();
    csgjs_node *ret = new csgjs_node(a->allPolygons());
    delete a;
    a = 0;
    delete b;
    b = 0;
    return ret;
}
// Return a new CSG solid representing space both this solid and in the
// solid `csg`. Neither this solid nor the solid `csg` are modified.
inline static csgjs_node *csg_intersect(const csgjs_node *a1, const csgjs_node *b1)
{
    csgjs_node *a = a1->clone();
    csgjs_node *b = b1->clone();
    a->invert();
    b->clipTo(a);
    b->invert();
    a->clipTo(b);
    b->clipTo(a);
    a->build(b->allPolygons());
    a->invert();
    csgjs_node *ret = new csgjs_node(a->allPolygons());
    delete a;
    a = 0;
    delete b;
    b = 0;
    return ret;
}

inline static csgjs_model csgjs_operation(const csgjs_model &a, const csgjs_model &b, csg_function fun)
{
    csgjs_node *A = new csgjs_node(csgjs_modelToPolygons(a));
    csgjs_node *B = new csgjs_node(csgjs_modelToPolygons(b));
    csgjs_node *AB = fun(A, B);
    std::vector<csgjs_polygon> polygons = AB->allPolygons();
    delete A;
    A = 0;
    delete B;
    B = 0;
    delete AB;
    AB = 0;
    return csgjs_modelFromPolygons(polygons);
}

csgjs_model csgjs_union(const csgjs_model &a, const csgjs_model &b)
{
    return csgjs_operation(a, b, csg_union);
}

csgjs_model csgjs_intersection(const csgjs_model &a, const csgjs_model &b)
{
    return csgjs_operation(a, b, csg_intersect);
}

csgjs_model csgjs_subtract(const csgjs_model &a, const csgjs_model &b)
{
    return csgjs_operation(a, b, csg_subtract);
}

EMSCRIPTEN_BINDINGS(CsgCpp)
{
    register_vector<int>("VectorInt");
    register_vector<csgjs_vertex>("VectorCsgjsVertex");
    register_vector<csgjs_polygon>("VectorCsgjsPolygon");

    class_<csgjs_vector>("CsgjsVector")
        .constructor<>()                    // 构造函数
        .constructor<float, float, float>() // 构造函数
        .property("x", &csgjs_vector::getX, &csgjs_vector::setX)
        .property("y", &csgjs_vector::getY, &csgjs_vector::setY)
        .property("z", &csgjs_vector::getZ, &csgjs_vector::setZ);

    class_<csgjs_vertex>("CsgjsVertex")
        .constructor<>()
        .property("position", &csgjs_vertex::getPosition, &csgjs_vertex::setPosition)
        .property("normal", &csgjs_vertex::getNormal, &csgjs_vertex::setNormal)
        .property("uv", &csgjs_vertex::getUV, &csgjs_vertex::setUV);

    class_<csgjs_model>("CsgjsModel")
        .constructor<>()
        .property("vertices", &csgjs_model::getVertices, &csgjs_model::setVertices)
        .property("indices", &csgjs_model::getIndices, &csgjs_model::setIndices);

    class_<csgjs_plane>("CsgjsPlane")
        .property("normal", &csgjs_plane::getNormal, &csgjs_plane::setNormal)
        .property("w", &csgjs_plane::getW, &csgjs_plane::setW)
        .constructor<>()
        .constructor<const csgjs_vector &, const csgjs_vector &, const csgjs_vector &>()
        .function("ok", &csgjs_plane::ok)
        .function("flip", &csgjs_plane::flip)
        .function("splitPolygon", &csgjs_plane::splitPolygon);

    class_<csgjs_polygon>("CsgjsPolygon")
        .property("vertices", &csgjs_polygon::getVertices, &csgjs_polygon::setVertices)
        .property("plane", &csgjs_polygon::getPlane, &csgjs_polygon::setPlane)
        .constructor<>()
        .constructor<const std::vector<csgjs_vertex> &>()
        .function("flip", &csgjs_polygon::flip);

    class_<csgjs_node>("CsgjsNode")
        .property("polygons", &csgjs_node::getPolygons, &csgjs_node::setPolygons)
        // .property("front", &csgjs_node::getFront1, &csgjs_node::setFront1)
        .function("getBack", &csgjs_node::getBack, allow_raw_pointers())
        .function("setBack", &csgjs_node::setBack, allow_raw_pointers())

        .function("getBack", &csgjs_node::getBack, allow_raw_pointers())
        .function("setBack", &csgjs_node::setBack, allow_raw_pointers())

        .property("plane", &csgjs_node::getPlane, &csgjs_node::setPlane)

        .constructor<>()
        .constructor<const std::vector<csgjs_polygon> &>()

        .function("clipTo", &csgjs_node::clipTo, allow_raw_pointers())
        .function("invert", &csgjs_node::invert)
        .function("build", &csgjs_node::build)
        .function("clipPolygons", &csgjs_node::clipPolygons)
        .function("allPolygons", &csgjs_node::allPolygons)
        .function("clone", &csgjs_node::clone, allow_raw_pointers());

    function("flip", &flip);
    function("interpolate", &interpolate);

    function("Csgjs_modelToPolygons", &csgjs_modelToPolygons);
    function("Csgjs_modelFromPolygons", &csgjs_modelFromPolygons);

    // function("csg_union", &csg_union, allow_raw_pointers());
    // function("csg_subtract", &csg_subtract,  allow_raw_pointers());
    // function("csg_intersect", &csg_intersect,  allow_raw_pointers());
    // function("csgjs_operation", &csgjs_operation, allow_raw_pointers());
    function("Csgjs_intersection", &csgjs_intersection);
    function("Csgjs_union", &csgjs_union);
    function("Csgjs_subtract", &csgjs_subtract);
}
#endif
