package localstore

import (
	"testing"

	"context"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"sourcegraph.com/sourcegraph/sourcegraph/api/sourcegraph"
)

type MockRepos struct {
	Get            func(ctx context.Context, repo int32) (*sourcegraph.Repo, error)
	GetByURI       func(ctx context.Context, repo string) (*sourcegraph.Repo, error)
	List           func(v0 context.Context, v1 *RepoListOp) ([]*sourcegraph.Repo, error)
	Search         func(v0 context.Context, v1 string) ([]*sourcegraph.RepoSearchResult, error)
	Create         func(v0 context.Context, v1 *sourcegraph.Repo) (int32, error)
	Update         func(v0 context.Context, v1 RepoUpdate) error
	InternalUpdate func(ctx context.Context, repo int32, op InternalRepoUpdate) error
	Delete         func(ctx context.Context, repo int32) error
}

func (s *MockRepos) MockGet(t *testing.T, wantRepo int32) (called *bool) {
	called = new(bool)
	s.Get = func(ctx context.Context, repo int32) (*sourcegraph.Repo, error) {
		*called = true
		if repo != wantRepo {
			t.Errorf("got repo %d, want %d", repo, wantRepo)
			return nil, grpc.Errorf(codes.NotFound, "repo %v not found", wantRepo)
		}
		return &sourcegraph.Repo{ID: repo}, nil
	}
	return
}

func (s *MockRepos) MockGet_Path(t *testing.T, wantRepo int32, repoPath string) (called *bool) {
	called = new(bool)
	s.Get = func(ctx context.Context, repo int32) (*sourcegraph.Repo, error) {
		*called = true
		if repo != wantRepo {
			t.Errorf("got repo %d, want %d", repo, wantRepo)
			return nil, grpc.Errorf(codes.NotFound, "repo %v not found", wantRepo)
		}
		return &sourcegraph.Repo{ID: repo, URI: repoPath}, nil
	}
	return
}

func (s *MockRepos) MockUpdate(t *testing.T, wantRepo int32) (called *bool) {
	called = new(bool)
	s.Update = func(ctx context.Context, repoUpdate RepoUpdate) error {
		*called = true
		if repoUpdate.ReposUpdateOp.Repo != wantRepo {
			t.Errorf("got repo %q, want %q", repoUpdate.ReposUpdateOp.Repo, wantRepo)
			return grpc.Errorf(codes.NotFound, "repo %v not found", wantRepo)
		}
		return nil
	}
	return
}

func (s *MockRepos) MockGet_Return(t *testing.T, returns *sourcegraph.Repo) (called *bool) {
	called = new(bool)
	s.Get = func(ctx context.Context, repo int32) (*sourcegraph.Repo, error) {
		*called = true
		if repo != returns.ID {
			t.Errorf("got repo %d, want %d", repo, returns.ID)
			return nil, grpc.Errorf(codes.NotFound, "repo %v (%d) not found", returns.URI, returns.ID)
		}
		return returns, nil
	}
	return
}

func (s *MockRepos) MockGetByURI(t *testing.T, wantURI string, repoID int32) (called *bool) {
	called = new(bool)
	s.GetByURI = func(ctx context.Context, uri string) (*sourcegraph.Repo, error) {
		*called = true
		if uri != wantURI {
			t.Errorf("got repo URI %q, want %q", uri, wantURI)
			return nil, grpc.Errorf(codes.NotFound, "repo %v not found", uri)
		}
		return &sourcegraph.Repo{ID: repoID, URI: uri}, nil
	}
	return
}

func (s *MockRepos) MockList(t *testing.T, wantRepos ...string) (called *bool) {
	called = new(bool)
	s.List = func(ctx context.Context, opt *RepoListOp) ([]*sourcegraph.Repo, error) {
		*called = true
		repos := make([]*sourcegraph.Repo, len(wantRepos))
		for i, repo := range wantRepos {
			repos[i] = &sourcegraph.Repo{URI: repo}
		}
		return repos, nil
	}
	return
}

func (s *MockRepos) MockInternalUpdate(t *testing.T) (called *bool) {
	called = new(bool)
	s.InternalUpdate = func(ctx context.Context, repo int32, op InternalRepoUpdate) error {
		*called = true
		return nil
	}
	return
}
